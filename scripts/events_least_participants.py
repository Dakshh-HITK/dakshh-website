#!/usr/bin/env python3
"""
Find events with the least number of participants.
For team events: shows both number of teams and number of participants.

Usage: python scripts/events_least_participants.py [--top N]
Default: top 10 events with least participants
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
    parser = argparse.ArgumentParser(description="Events with least participants")
    parser.add_argument("--top", type=int, default=10, help="Number of events to show (default: 10)")
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

    # Get all events with participant count
    event_list = list(events.find({}, {"_id": 1, "eventName": 1, "isTeamEvent": 1, "category": 1}))

    results = []
    for ev in event_list:
        eid = ev["_id"]
        participant_count = registrations.count_documents({"eventId": eid})
        is_team = ev.get("isTeamEvent", False)

        row = {
            "eventName": ev["eventName"],
            "category": ev.get("category", ""),
            "isTeamEvent": is_team,
            "participants": participant_count,
        }
        if is_team:
            team_count = teams.count_documents({"eventId": eid})
            row["teams"] = team_count
        results.append(row)

    # Sort by participants ascending (least first)
    results.sort(key=lambda x: x["participants"])

    # Take top N
    top = results[: args.top]

    print(f"\nTop {len(top)} events with LEAST participants:\n")
    print(f"{'#':<4} {'Event':<35} {'Participants':<12} {'Teams':<8} {'Type'}")
    print("-" * 75)

    for i, r in enumerate(top, 1):
        ev_name = (r["eventName"] or "")[:34]
        parts = r["participants"]
        teams_str = str(r["teams"]) if r.get("teams") is not None else "-"
        ev_type = "Team" if r["isTeamEvent"] else "Solo"
        print(f"{i:<4} {ev_name:<35} {parts:<12} {teams_str:<8} {ev_type}")

    print()


if __name__ == "__main__":
    main()
