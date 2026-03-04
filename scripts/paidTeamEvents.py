import pandas as pd
from pymongo import MongoClient
from bson import ObjectId
import os

# --- CONFIGURATION ---
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")
EXCEL_FILE = "team_registrations.xlsx"

def update_teams_from_excel():
    # 1. Connect to MongoDB
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    
    # Collections
    events_col = db["events"]
    teams_col = db["teams"]
    registrations_col = db["registrations"]

    # 2. Read Excel
    try:
        df = pd.read_excel(EXCEL_FILE)
    except Exception as e:
        print(f"Error reading Excel: {e}")
        return

    for index, row in df.iterrows():
        team_name = str(row['Team Name']).strip()
        event_name = str(row['Event Name']).strip()

        print(f"\nProcessing: Team '{team_name}' for Event '{event_name}'...")

        # 3. Find the Event ID first
        event = events_col.find_one({"eventName": event_name})
        if not event:
            print(f"  [!] Event not found: {event_name}")
            continue
        
        event_id = event['_id']

        # 4. Find the Team by Name and Event ID
        team = teams_col.find_one({
            "teamName": team_name,
            "eventId": event_id
        })

        if not team:
            print(f"  [!] Team '{team_name}' not found for this event.")
            continue

        team_id = team['_id']

        # 5. Update Team Payment Status
        # Note: Your schema says 'paymentStatus' (enum: pending, completed, failed)
        teams_col.update_one(
            {"_id": team_id},
            {"$set": {"paymentStatus": "completed"}}
        )
        print(f"  [+] Updated paymentStatus to 'completed' for team: {team_name}")

        # 6. Update Verified status for all participants in that team
        # We find registrations linked to this specific teamId
        reg_result = registrations_col.update_many(
            {"teamId": team_id, "eventId": event_id},
            {"$set": {"verified": True}}
        )
        
        print(f"  [+] Verified {reg_result.modified_count} team members.")

    print("\n--- Processing Complete ---")
    client.close()

if __name__ == "__main__":
    update_teams_from_excel()