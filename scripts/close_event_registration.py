#!/usr/bin/env python3
"""
Stop registration for an event by setting isActive = false.

Usage: python scripts/close_event_registration.py [event_name]
       python scripts/close_event_registration.py "Skeld Sprint" --dry-run

Default event: Skeld Sprint
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
    parser = argparse.ArgumentParser(description="Close event registration (set isActive=false)")
    parser.add_argument("event_name", nargs="?", default="Skeld Sprint", help="Event name (default: Skeld Sprint)")
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
    event = events.find_one({"eventName": args.event_name})

    if not event:
        print(f"Event not found: {args.event_name!r}", file=sys.stderr)
        sys.exit(1)

    if not event.get("isActive", True):
        print(f"Registration already closed for: {event['eventName']}")
        return

    if args.dry_run:
        print(f"[DRY RUN] Would set isActive=false for: {event['eventName']} (_id: {event['_id']})")
        return

    result = events.update_one({"_id": event["_id"]}, {"$set": {"isActive": False}})
    if result.modified_count:
        print(f"Registration closed for: {event['eventName']}")
    else:
        print("No change (event may already be inactive)")


if __name__ == "__main__":
    main()
