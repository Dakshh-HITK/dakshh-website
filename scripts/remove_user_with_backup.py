#!/usr/bin/env python3
"""
Surgically remove a user and all affiliated data from the database.
Creates a local JSON backup before deletion. Supports restore.

Usage:
  python scripts/remove_user_with_backup.py <user_id|fullName>     # Delete (with backup)
  python scripts/remove_user_with_backup.py <user_id|fullName> --dry-run   # Preview only
  python scripts/remove_user_with_backup.py --restore <backup.json>       # Restore from backup
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from dotenv import load_dotenv

load_dotenv(root / "client" / ".env.local")
load_dotenv(root / ".env.local")
load_dotenv(root / ".env")

from pymongo import MongoClient
from bson import ObjectId

BACKUPS_DIR = Path(__file__).resolve().parent / "backups"


def get_db(client):
    db_name = os.getenv("DB_NAME")
    if db_name:
        return client[db_name]
    dbs = [d for d in client.list_database_names() if d not in ("admin", "config", "local")]
    for name in dbs:
        if "users" not in client[name].list_collection_names():
            continue
        if client[name]["users"].find_one({"fullName": {"$exists": True}}):
            return client[name]
    for name in dbs:
        if "users" in client[name].list_collection_names():
            return client[name]
    return None


def serialize(d):
    """Convert doc for JSON (ObjectId/datetime -> str)."""
    if isinstance(d, dict):
        return {k: serialize(v) for k, v in d.items()}
    if isinstance(d, list):
        return [serialize(x) for x in d]
    if isinstance(d, ObjectId):
        return str(d)
    if isinstance(d, datetime):
        return d.isoformat()
    return d


def deserialize(d):
    """Convert JSON backup back for MongoDB insert (_id, datetime)."""
    if isinstance(d, dict):
        out = {}
        for k, v in d.items():
            if k == "_id" and isinstance(v, str) and len(v) == 24:
                try:
                    out[k] = ObjectId(v)
                except Exception:
                    out[k] = v
            elif k in ("createdAt", "updatedAt", "checkedInAt", "lastFoodServedAt", "emailVerified") and isinstance(v, str):
                try:
                    out[k] = datetime.fromisoformat(v.replace("Z", "+00:00"))
                except Exception:
                    out[k] = v
            else:
                out[k] = deserialize(v)
        return out
    if isinstance(d, list):
        return [deserialize(x) for x in d]
    return d


def fetch_full_context(db, oid):
    """Fetch user + all related docs. Returns raw docs for backup."""
    user = db["users"].find_one({"_id": oid})
    if not user:
        return None

    regs = list(db["registrations"].find({"participant": oid}))
    teams_lead = list(db["teams"].find({"teamLeader": oid}))
    teams_mem = list(db["teams"].find({"team": oid}))
    sem_coll = "SeminarRegistration" if "SeminarRegistration" in db.list_collection_names() else "seminarregistrations"
    sem_regs = list(db[sem_coll].find({"participant": oid}))

    # Dedupe teams (leader teams also appear in teams_mem when user is sole member)
    team_ids = {t["_id"] for t in teams_lead}
    for t in teams_mem:
        if t["_id"] not in team_ids:
            teams_lead.append(t)

    return {
        "user": user,
        "registrations": regs,
        "teams": teams_lead,
        "seminar_registrations": sem_regs,
        "meta": {
            "backup_at": datetime.now(timezone.utc).isoformat(),
            "user_id": str(oid),
            "username": user.get("username"),
            "fullName": user.get("fullName"),
            "email": user.get("email"),
        },
    }


def delete_user_data(db, ctx):
    """Delete in correct order to avoid ref issues."""
    oid = ctx["user"]["_id"]
    sem_coll = "SeminarRegistration" if "SeminarRegistration" in db.list_collection_names() else "seminarregistrations"

    # events.registrations: solo events store Registration IDs, team events store Team IDs
    events_updated = 0

    # Solo registrations: pull registration IDs from events
    for r in ctx["registrations"]:
        if not r.get("isInTeam"):
            result = db["events"].update_one(
                {"_id": r["eventId"]},
                {"$pull": {"registrations": r["_id"]}}
            )
            if result.modified_count:
                events_updated += 1

    # Teams being deleted: pull team IDs from events (team events store team IDs in events.registrations)
    for t in ctx["teams"]:
        result = db["events"].update_one(
            {"_id": t["eventId"]},
            {"$pull": {"registrations": t["_id"]}}
        )
        if result.modified_count:
            events_updated += 1

    # Now delete registrations
    r = db["registrations"].delete_many({"participant": oid})
    reg_deleted = r.deleted_count

    # 2. Teams (where user is leader or member)
    team_ids = [t["_id"] for t in ctx["teams"]]
    t = db["teams"].delete_many({"_id": {"$in": team_ids}})
    team_deleted = t.deleted_count

    # 3. Seminar registrations
    s = db[sem_coll].delete_many({"participant": oid})
    sem_deleted = s.deleted_count

    # 4. User
    u = db["users"].delete_one({"_id": oid})
    user_deleted = u.deleted_count

    return {
        "registrations": reg_deleted,
        "events_updated": events_updated,
        "teams": team_deleted,
        "seminar_registrations": sem_deleted,
        "user": user_deleted,
    }


def restore_from_backup(db, backup_path):
    """Restore documents from backup JSON."""
    path = Path(backup_path)
    if not path.is_file():
        print(f"Backup file not found: {path}", file=sys.stderr)
        sys.exit(1)

    with open(path) as f:
        data = json.load(f)

    meta = data.get("meta", {})
    print(f"Restoring backup for user: {meta.get('username')} ({meta.get('fullName')})")

    # Restore order: user first, then registrations, teams, seminar_registrations
    sem_coll = "SeminarRegistration" if "SeminarRegistration" in db.list_collection_names() else "seminarregistrations"

    user = deserialize(data["user"])
    db["users"].insert_one(user)
    print(f"  Restored user: {user['_id']}")

    # Restore registrations; for solo only, add reg ID to events.registrations
    for r in data["registrations"]:
        doc = deserialize(r)
        db["registrations"].insert_one(doc)
        if not doc.get("isInTeam"):
            db["events"].update_one(
                {"_id": doc["eventId"]},
                {"$addToSet": {"registrations": doc["_id"]}}
            )
        print(f"  Restored registration: {doc['_id']}")

    # Restore teams; add team ID to events.registrations (team events store team IDs)
    for t in data["teams"]:
        doc = deserialize(t)
        db["teams"].insert_one(doc)
        db["events"].update_one(
            {"_id": doc["eventId"]},
            {"$addToSet": {"registrations": doc["_id"]}}
        )
        print(f"  Restored team: {doc['_id']}")

    for sr in data["seminar_registrations"]:
        doc = deserialize(sr)
        db[sem_coll].insert_one(doc)
        print(f"  Restored seminar registration: {doc['_id']}")

    print("Restore complete.")


def main():
    parser = argparse.ArgumentParser(description="Remove user and affiliated data (with backup/restore)")
    parser.add_argument("ident", nargs="?", help="User _id or fullName")
    parser.add_argument("--dry-run", action="store_true", help="Preview only, do not delete")
    parser.add_argument("--restore", metavar="BACKUP.json", help="Restore from backup file")
    args = parser.parse_args()

    uri = os.getenv("MONGODB_URI")
    if not uri:
        print("MONGODB_URI not set in env", file=sys.stderr)
        sys.exit(1)

    client = MongoClient(uri)
    db = get_db(client)
    if db is None:
        print("No suitable database found", file=sys.stderr)
        sys.exit(1)

    # --- RESTORE ---
    if args.restore:
        restore_from_backup(db, args.restore)
        return

    # --- DELETE ---
    if not args.ident:
        parser.error("ident required (user _id or fullName)")

    ident = args.ident
    oid = None
    if len(ident) == 24 and all(c in "0123456789abcdef" for c in ident.lower()):
        try:
            oid = ObjectId(ident)
        except Exception:
            pass

    if oid:
        user = db["users"].find_one({"_id": oid})
    else:
        user = db["users"].find_one({"fullName": ident})
        if user:
            oid = user["_id"]

    if not user:
        print(f"User not found: {ident}", file=sys.stderr)
        sys.exit(1)

    ctx = fetch_full_context(db, oid)
    if not ctx:
        print("Could not fetch user context", file=sys.stderr)
        sys.exit(1)

    # Serialize for backup
    backup_data = {
        "user": serialize(dict(ctx["user"])),
        "registrations": [serialize(dict(r)) for r in ctx["registrations"]],
        "teams": [serialize(dict(t)) for t in ctx["teams"]],
        "seminar_registrations": [serialize(dict(sr)) for sr in ctx["seminar_registrations"]],
        "meta": {
            "backup_at": datetime.now(timezone.utc).isoformat(),
            "user_id": str(oid),
            "username": user.get("username"),
            "fullName": user.get("fullName"),
            "email": user.get("email"),
        },
    }

    # Save backup
    BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    username_safe = (user.get("username") or "user").replace("/", "-")[:30]
    backup_path = BACKUPS_DIR / f"user_backup_{username_safe}_{ts}.json"
    with open(backup_path, "w") as f:
        json.dump(backup_data, f, indent=2, default=str)
    print(f"Backup saved to: {backup_path}")

    if args.dry_run:
        print("\n[DRY RUN] Would delete:")
        print(f"  - 1 user: {user.get('username')} ({user.get('fullName')})")
        print(f"  - {len(ctx['registrations'])} registration(s)")
        print(f"  - {len(ctx['teams'])} team(s)")
        print(f"  - {len(ctx['seminar_registrations'])} seminar registration(s)")
        print(f"\nTo actually delete, run without --dry-run")
        print(f"To restore: python scripts/remove_user_with_backup.py --restore {backup_path}")
        return

    # Delete
    counts = delete_user_data(db, ctx)
    print(f"\nDeleted: {counts['user']} user, {counts['registrations']} registrations, "
          f"{counts['teams']} teams, {counts['seminar_registrations']} seminar registrations")
    print(f"Updated {counts['events_updated']} event(s) (removed registration IDs from events.registrations)")
    print(f"\nTo restore: python scripts/remove_user_with_backup.py --restore {backup_path}")


if __name__ == "__main__":
    main()
