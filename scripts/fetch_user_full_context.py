#!/usr/bin/env python3
"""
Fetch ALL data connected to a user (by _id or fullName).
Usage: python scripts/fetch_user_full_context.py <user_id|fullName>
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from dotenv import load_dotenv
load_dotenv(root / "client" / ".env.local")
load_dotenv(root / ".env.local")
load_dotenv(root / ".env")

from pymongo import MongoClient
from bson import ObjectId


USER_ID = "699450b777a3687fa08aa640"


def json_serial(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def serialize(d):
    if isinstance(d, dict):
        return {k: serialize(v) for k, v in d.items()}
    if isinstance(d, list):
        return [serialize(x) for x in d]
    if isinstance(d, ObjectId):
        return str(d)
    if isinstance(d, datetime):
        return d.isoformat()
    return d


def main():
    uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("DB_NAME")
    if not uri:
        print("MONGODB_URI not set", file=sys.stderr)
        sys.exit(1)

    ident = sys.argv[1] if len(sys.argv) > 1 else USER_ID
    client = MongoClient(uri)

    if db_name:
        db = client[db_name]
    else:
        dbs = [d for d in client.list_database_names() if d not in ("admin", "config", "local")]
        db = None
        for name in dbs:
            if "users" not in client[name].list_collection_names():
                continue
            if client[name]["users"].find_one({"fullName": {"$exists": True}}):
                db = client[name]
                break
        if db is None:
            for name in dbs:
                if "users" in client[name].list_collection_names():
                    db = client[name]
                    break
        if db is None:
            print("No suitable database found", file=sys.stderr)
            sys.exit(1)

    oid = None
    if len(ident) == 24 and all(c in "0123456789abcdef" for c in ident.lower()):
        try:
            oid = ObjectId(ident)
        except Exception:
            pass

    users = db["users"]
    if oid:
        user = users.find_one({"_id": oid})
    else:
        user = users.find_one({"fullName": ident})
        if user:
            oid = user["_id"]

    if not user:
        print(f"User not found: {ident}", file=sys.stderr)
        sys.exit(1)

    result = {
        "user": serialize(dict(user)),
        "registrations_as_participant": [],
        "registrations_checked_in_by_user": [],
        "teams_as_leader": [],
        "teams_as_member": [],
        "seminar_registrations": [],
    }

    # 1. Registrations where this user is the participant
    regs = db["registrations"].find({"participant": oid})
    for r in regs:
        ev = db["events"].find_one({"_id": r["eventId"]})
        r_dict = serialize(dict(r))
        r_dict["eventName"] = ev["eventName"] if ev else None
        result["registrations_as_participant"].append(r_dict)

    # 2. Registrations where this user did the check-in (checkedInBy)
    regs_by = db["registrations"].find({"checkedInBy": oid})
    for r in regs_by:
        ev = db["events"].find_one({"_id": r["eventId"]})
        part = db["users"].find_one({"_id": r["participant"]}, {"username": 1, "fullName": 1, "email": 1})
        r_dict = serialize(dict(r))
        r_dict["eventName"] = ev["eventName"] if ev else None
        r_dict["checkedInParticipant"] = part
        result["registrations_checked_in_by_user"].append(r_dict)

    # 3. Teams where this user is teamLeader
    teams_lead = db["teams"].find({"teamLeader": oid})
    for t in teams_lead:
        ev = db["events"].find_one({"_id": t["eventId"]})
        members = list(db["users"].find({"_id": {"$in": t.get("team", [])}}, {"username": 1, "fullName": 1, "email": 1}))
        t_dict = serialize(dict(t))
        t_dict["eventName"] = ev["eventName"] if ev else None
        t_dict["members"] = members
        result["teams_as_leader"].append(t_dict)

    # 4. Teams where this user is in team[] (member, not leader)
    teams_mem = db["teams"].find({"team": oid})
    for t in teams_mem:
        ev = db["events"].find_one({"_id": t["eventId"]})
        leader = db["users"].find_one({"_id": t["teamLeader"]}, {"username": 1, "fullName": 1, "email": 1})
        t_dict = serialize(dict(t))
        t_dict["eventName"] = ev["eventName"] if ev else None
        t_dict["teamLeaderInfo"] = leader
        result["teams_as_member"].append(t_dict)

    # 5. Seminar registrations (collection: SeminarRegistration)
    sem_coll = "SeminarRegistration" if "SeminarRegistration" in db.list_collection_names() else "seminarregistrations"
    sem_ref = "Seminar" if "Seminar" in db.list_collection_names() else "seminars"
    for sr in db[sem_coll].find({"participant": oid}):
        sem = db[sem_ref].find_one({"_id": sr["seminarId"]})
        sr_dict = serialize(dict(sr))
        sr_dict["seminarTitle"] = sem["title"] if sem else None
        result["seminar_registrations"].append(sr_dict)

    print(json.dumps(result, indent=2, default=json_serial))


if __name__ == "__main__":
    main()
