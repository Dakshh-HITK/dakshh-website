#!/usr/bin/env python3
"""
Toggle event registration on/off (set isActive).

Usage:
  python scripts/toggle_event_registration.py [--on|--off|--toggle] [--event "Mélange"]
  python scripts/toggle_event_registration.py --on --event "Mélange"   # Turn on
  python scripts/toggle_event_registration.py --off --event "Mélange"  # Turn off
  python scripts/toggle_event_registration.py --toggle --event "Mélange"  # Flip state
  python scripts/toggle_event_registration.py --event "Mélange"       # Show status only

Default event: Mélange
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
    parser = argparse.ArgumentParser(description="Toggle event registration (isActive)")
    parser.add_argument("--event", default="Mélange", help="Event name (default: Mélange)")
    parser.add_argument("--on", action="store_true", help="Turn registration ON (isActive=true)")
    parser.add_argument("--off", action="store_true", help="Turn registration OFF (isActive=false)")
    parser.add_argument("--toggle", action="store_true", help="Toggle current state")
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
    event = events.find_one({"eventName": args.event})

    if not event:
        print(f"Event not found: {args.event!r}", file=sys.stderr)
        sys.exit(1)

    current_state = event.get("isActive", False)
    status = "OPEN" if current_state else "CLOSED"
    print(f"Event: {event['eventName']}")
    print(f"Current status: {status} (isActive={current_state})")

    # Determine target state
    if args.on and args.off:
        print("Error: Cannot specify both --on and --off", file=sys.stderr)
        sys.exit(1)

    if args.on:
        target_state = True
        action = "turn ON"
    elif args.off:
        target_state = False
        action = "turn OFF"
    elif args.toggle:
        target_state = not current_state
        action = "toggle to " + ("ON" if target_state else "OFF")
    else:
        # Just show status
        return

    if current_state == target_state:
        print(f"Registration already {status.lower()}. No change needed.")
        return

    if args.dry_run:
        print(f"[DRY RUN] Would {action} registration (set isActive={target_state})")
        return

    result = events.update_one({"_id": event["_id"]}, {"$set": {"isActive": target_state}})
    if result.modified_count:
        new_status = "OPEN" if target_state else "CLOSED"
        print(f"Registration {action.replace('turn ', '').replace('toggle to ', '')} ({new_status})")
    else:
        print("No change made")


if __name__ == "__main__":
    main()
