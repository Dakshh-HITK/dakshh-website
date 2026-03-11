#!/usr/bin/env python3
"""
Clean up orphaned IDs from events.registrations arrays.

IMPORTANT: events.registrations stores different ID types by event type:
  - Solo events (isTeamEvent=false): Registration IDs -> check against registrations collection
  - Team events (isTeamEvent=true):  Team IDs       -> check against teams collection

Usage:
  python scripts/cleanup_orphaned_registrations.py [--dry-run]
  python scripts/cleanup_orphaned_registrations.py --event "Event Name"  # Clean specific event
"""

import argparse
import os
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


def main():
    parser = argparse.ArgumentParser(description="Clean orphaned registration IDs from events")
    parser.add_argument("--event", help="Clean specific event only")
    parser.add_argument("--dry-run", action="store_true", help="Preview only, do not update")
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

    events = db["events"]
    registrations = db["registrations"]
    teams = db["teams"]

    # Get events to check
    if args.event:
        event_list = list(events.find({"eventName": args.event}))
        if not event_list:
            print(f"Event not found: {args.event}", file=sys.stderr)
            sys.exit(1)
    else:
        event_list = list(events.find({}))

    total_orphaned = 0
    events_cleaned = 0

    print(f"Checking {len(event_list)} event(s)...\n")

    for event in event_list:
        event_name = event.get("eventName", "Unknown")
        is_team_event = event.get("isTeamEvent", False)
        arr_ids = event.get("registrations", [])
        
        if not arr_ids:
            continue

        # Solo events: array contains Registration IDs. Team events: array contains Team IDs.
        if is_team_event:
            existing_ids = set(
                t["_id"] for t in teams.find(
                    {"_id": {"$in": arr_ids}},
                    {"_id": 1}
                )
            )
            id_type = "team"
        else:
            existing_ids = set(
                r["_id"] for r in registrations.find(
                    {"_id": {"$in": arr_ids}},
                    {"_id": 1}
                )
            )
            id_type = "registration"
        
        orphaned_ids = [oid for oid in arr_ids if oid not in existing_ids]

        if orphaned_ids:
            total_orphaned += len(orphaned_ids)
            events_cleaned += 1
            print(f"Event: {event_name} ({id_type} event)")
            print(f"  Total IDs in array: {len(arr_ids)}")
            print(f"  Existing: {len(existing_ids)}, Orphaned: {len(orphaned_ids)}")
            print(f"  Orphaned IDs: {[str(oid) for oid in orphaned_ids[:5]]}")
            if len(orphaned_ids) > 5:
                print(f"    ... and {len(orphaned_ids) - 5} more")
            
            if not args.dry_run:
                result = events.update_one(
                    {"_id": event["_id"]},
                    {"$pull": {"registrations": {"$in": orphaned_ids}}}
                )
                if result.modified_count:
                    print(f"  ✓ Cleaned {len(orphaned_ids)} orphaned ID(s)")
                else:
                    print(f"  ✗ Failed to update")
            else:
                print(f"  [DRY RUN] Would remove {len(orphaned_ids)} orphaned ID(s)")
            print()

    if total_orphaned == 0:
        print("No orphaned registration IDs found. All clean!")
    else:
        if args.dry_run:
            print(f"\n[DRY RUN] Would clean {total_orphaned} orphaned ID(s) from {events_cleaned} event(s)")
            print("Run without --dry-run to apply changes.")
        else:
            print(f"\nCleaned {total_orphaned} orphaned ID(s) from {events_cleaned} event(s)")


if __name__ == "__main__":
    main()
