from pymongo import MongoClient, ReplaceOne
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()
SOURCE_URI = os.getenv("MONGODB_URI")
TARGET_URI = os.getenv("TARGET_URI")
DB_NAME = os.getenv("DB_NAME") # Name of the DB in both clusters

def clone_cyber_quest():
    source_client = MongoClient(SOURCE_URI)
    target_client = MongoClient(TARGET_URI)

    s_db = source_client[DB_NAME]
    t_db = target_client[DB_NAME]

    try:
        # 1. Fetch the Event "Cyber Quest"
        event = s_db.events.find_one({"eventName": "Cyber Quest"})
        if not event:
            print("Event 'Cyber Quest' not found!")
            return

        event_id = event['_id']
        print(f"Found Event ID: {event_id}. Starting migration...")

        # 2. Get all Registrations for this event
        registrations = list(s_db.registrations.find({"eventId": event_id}))
        reg_ids = [r['_id'] for r in registrations]

        # 3. Get all Teams for this event
        teams = list(s_db.teams.find({"eventId": event_id}))

        # 4. Collect all User IDs involved
        # We need: participants, team leaders, team members, and check-in admins
        user_ids = set()
        
        for r in registrations:
            user_ids.add(r.get('participant'))
            if r.get('checkedInBy'):
                user_ids.add(r.get('checkedInBy'))
        
        for t in teams:
            user_ids.add(t.get('teamLeader'))
            for member_id in t.get('team', []):
                user_ids.add(member_id)

        # Remove None if any fields were empty
        user_ids.discard(None)
        users = list(s_db.users.find({"_id": {"$in": list(user_ids)}}))

        # --- DATA INSERTION (Upsert logic to preserve IDs) ---

        def bulk_upsert(collection_name, data_list):
            if not data_list:
                return
            ops = [
                ReplaceOne({"_id": doc["_id"]}, doc, upsert=True) 
                for doc in data_list
            ]
            result = t_db[collection_name].bulk_write(ops)
            print(f"Collection '{collection_name}': Matched {result.matched_count}, Upserted {result.upserted_count}")

        print("\nPushing data to Target DB...")
        bulk_upsert("events", [event])
        bulk_upsert("registrations", registrations)
        bulk_upsert("teams", teams)
        bulk_upsert("users", users)

        print("\nMigration complete. All IDs preserved.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        source_client.close()
        target_client.close()

if __name__ == "__main__":
    clone_cyber_quest()