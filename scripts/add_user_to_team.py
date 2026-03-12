#!/usr/bin/env python3
"""
Surgically add an existing user to a team in an event.
Creates a registration and adds the user to the team's member list.

Usage:
  python scripts/add_user_to_team.py --user <username|fullName|email> --team <teamCode> [--event "Cyber Quest"] [--dry-run]
  python scripts/add_user_to_team.py --user kumar --team DAKSHH-XXXXX --event "Cyber Quest" --dry-run   # Preview only
  python scripts/add_user_to_team.py --user kumar --team DAKSHH-XXXXX --event "Cyber Quest"            # Execute

Dry-run is the DEFAULT. Use --execute to run for real.
"""

import argparse
import os
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from dotenv import load_dotenv

load_dotenv(root / "client" / ".env.local")
load_dotenv(root / ".env.local")
load_dotenv(root / ".env")

from pymongo import MongoClient
from bson import ObjectId

EVENT_NAME = "Cyber Quest"


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


def find_user(db, ident):
    """Find user by username, fullName, or email. Prefer exact email when ident looks like email."""
    users = db["users"]
    ident = ident.strip()
    # If it looks like an email, try exact email match FIRST (avoids wrong matches like "kumar" -> Nikunj Kumar)
    if "@" in ident and "." in ident:
        u = users.find_one({"email": ident})
        if u:
            return u
        u = users.find_one({"email": re.compile(f"^{re.escape(ident)}$", re.I)})
        if u:
            return u
    # Exact match for other fields
    for field in ["username", "email", "fullName"]:
        u = users.find_one({field: ident})
        if u:
            return u
    # Case-insensitive partial (only if no @ - avoid "kumar" matching wrong email)
    if "@" not in ident:
        for field in ["username", "fullName"]:
            u = users.find_one({field: re.compile(re.escape(ident), re.I)})
            if u:
                return u
        u = users.find_one({"fullName": re.compile(re.escape(ident), re.I)})
        if u:
            return u
    return None


def main():
    parser = argparse.ArgumentParser(description="Add user to team (prod - use with care)")
    parser.add_argument("--user", help="Username, fullName, or email (partial match ok)")
    parser.add_argument("--team", help="Team code (e.g. DAKSHH-XXXXX)")
    parser.add_argument("--event", default=EVENT_NAME, help=f"Event name (default: {EVENT_NAME})")
    parser.add_argument("--list-teams", action="store_true", help="List teams for the event and exit")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Preview only (default)")
    parser.add_argument("--execute", action="store_true", help="Actually run the operation")
    args = parser.parse_args()

    dry_run = not args.execute

    uri = os.getenv("MONGODB_URI")
    if not uri:
        print("MONGODB_URI not set in env", file=sys.stderr)
        sys.exit(1)

    client = MongoClient(uri)
    db = get_db(client)
    if db is None:
        print("No suitable database found", file=sys.stderr)
        sys.exit(1)

    event = db["events"].find_one({"eventName": args.event})
    if not event:
        print(f"Event not found: {args.event}", file=sys.stderr)
        sys.exit(1)

    if args.list_teams:
        teams = list(db["teams"].find({"eventId": event["_id"]}).sort("teamCode", 1))
        print(f"\nTeams for '{args.event}':\n")
        for t in teams:
            members = len(t.get("team") or [])
            print(f"  {t.get('teamCode'):<25} {t.get('teamName') or '(unnamed)':<30} members: {members}  payment: {t.get('paymentStatus', '?')}")
        print()
        sys.exit(0)

    if not args.list_teams and (not args.user or not args.team):
        parser.error("--user and --team required (unless --list-teams)")
    if not dry_run:
        print("WARNING: EXECUTE mode - will modify production database.\n")

    # 1. Find user
    user = find_user(db, args.user.strip())
    if not user:
        print(f"User not found: {args.user}", file=sys.stderr)
        sys.exit(1)
    user_id = user["_id"]
    print(f"User: {user.get('username')} | {user.get('fullName')} | {user.get('email')} (_id: {user_id})")

    # 2. Find event
    event = db["events"].find_one({"eventName": args.event})
    if not event:
        print(f"Event not found: {args.event}", file=sys.stderr)
        sys.exit(1)
    if not event.get("isTeamEvent"):
        print(f"Event '{args.event}' is not a team event", file=sys.stderr)
        sys.exit(1)
    event_id = event["_id"]
    max_members = event.get("maxMembersPerTeam", 10)
    print(f"Event: {event['eventName']} (maxMembersPerTeam: {max_members})")

    # 3. Find team (by teamCode, case-insensitive)
    team = db["teams"].find_one({
        "eventId": event_id,
        "teamCode": re.compile(f"^{re.escape(args.team.strip())}$", re.I),
    })
    if not team:
        # Try teamCode contains
        team = db["teams"].find_one({
            "eventId": event_id,
            "teamCode": re.compile(re.escape(args.team.strip()), re.I),
        })
    if not team:
        print(f"Team not found: {args.team} (for event {args.event})", file=sys.stderr)
        sys.exit(1)
    team_id = team["_id"]
    team_members = team.get("team") or []
    payment_status = team.get("paymentStatus") or "pending"
    is_paid_event = event.get("isPaidEvent", False)
    # Free events: all registrations are verified. Paid events: verified only when team payment completed.
    verified = True if is_paid_event is False else (payment_status == "completed")
    print(f"Team: {team.get('teamName')} | {team.get('teamCode')} | members: {len(team_members)}/{max_members} | payment: {payment_status}")

    # 4. Validate
    existing_reg = db["registrations"].find_one({
        "eventId": event_id,
        "participant": user_id,
    })
    if existing_reg:
        print(f"User already registered for this event (registration: {existing_reg['_id']})", file=sys.stderr)
        sys.exit(1)

    if user_id in team_members:
        print("User already in team", file=sys.stderr)
        sys.exit(1)

    if len(team_members) >= max_members:
        print(f"Team is full ({len(team_members)}/{max_members})", file=sys.stderr)
        sys.exit(1)

    # 5. Plan
    print(f"\nPlanned operations:")
    print(f"  1. Create registration: eventId={event_id}, participant={user_id}, isInTeam=true, teamId={team_id}, verified={verified}")
    print(f"  2. Add user {user_id} to team.team array")

    if dry_run:
        print(f"\n[DRY RUN] No changes made. Run with --execute to apply.")
        sys.exit(0)

    # 6. Execute
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    reg_doc = {
        "eventId": event_id,
        "isInTeam": True,
        "teamId": team_id,
        "participant": user_id,
        "verified": verified,
        "checkedIn": False,
        "foodServedCount": 0,
        "createdAt": now,
        "updatedAt": now,
    }
    reg_result = db["registrations"].insert_one(reg_doc)
    db["teams"].update_one(
        {"_id": team_id},
        {"$push": {"team": user_id}, "$set": {"updatedAt": now}},
    )
    print(f"\nDone. Registration created: {reg_result.inserted_id}")
    print(f"User added to team {team.get('teamCode')}.")


if __name__ == "__main__":
    main()
