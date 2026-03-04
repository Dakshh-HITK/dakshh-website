import pandas as pd
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")
EXCEL_FILE = "team.xlsx"

def update_teams_from_excel():
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    
    events_col = db["events"]
    teams_col = db["teams"]
    registrations_col = db["registrations"]
    users_col = db["users"]

    try:
        df = pd.read_excel(EXCEL_FILE)
    except Exception as e:
        print(f"Error reading Excel: {e}")
        return

    skipped_count = 0
    success_count = 0

    for index, row in df.iterrows():
        # 1. TRANSACTION GATEKEEPER
        # Check if both columns exist and are not empty/NaN
        order_id = row.get('Order_id')
        payment_id = row.get('Payment_id')

        if pd.isna(order_id) or pd.isna(payment_id) or str(order_id).strip() == "" or str(payment_id).strip() == "":
            print(f"[!] Skipping Row {index + 2}: Missing Payment/Order ID.")
            skipped_count += 1
            continue

        # 2. Source of Trust: Email & Event
        excel_email = str(row['Email']).strip().lower()
        excel_team_name = str(row['Team Name']).strip()
        event_name = str(row['EventName']).strip()

        print(f"\n[Processing] Leader: {excel_email} | Event: {event_name}")

        # 3. Get Event ID
        event = events_col.find_one({"eventName": event_name})
        if not event:
            print(f"  [!] Event '{event_name}' not found.")
            skipped_count += 1
            continue
        event_id = event['_id']

        # 4. Find User by Email
        user = users_col.find_one({"email": excel_email})
        if not user:
            print(f"  [!] User '{excel_email}' not found in DB.")
            skipped_count += 1
            continue
        user_id = user['_id']

        # 5. Find Team linked to this leader and event
        team = teams_col.find_one({
            "teamLeader": user_id,
            "eventId": event_id
        })

        if not team:
            print(f"  [!] No team found for leader {excel_email} in this event.")
            skipped_count += 1
            continue

        # 6. Back-reference Check: Team Name
        db_team_name = team.get('teamName', '')
        if db_team_name.lower() != excel_team_name.lower():
            print(f"  [X] NAME MISMATCH: Excel '{excel_team_name}' vs DB '{db_team_name}'.")
            skipped_count += 1
            continue 

        team_id = team['_id']

        # 7. Perform Updates (No Transaction IDs stored here)
        teams_col.update_one(
            {"_id": team_id},
            {"$set": {"paymentStatus": "completed"}}
        )

        reg_result = registrations_col.update_many(
            {"teamId": team_id, "eventId": event_id},
            {"$set": {"verified": True}}
        )
        
        print(f"  [+] Success: Team '{db_team_name}' verified. ({reg_result.modified_count} members)")
        success_count += 1

    print("\n--- Processing Complete ---")
    print(f"Total Successful: {success_count}")
    print(f"Total Skipped:    {skipped_count}")
    client.close()

if __name__ == "__main__":
    update_teams_from_excel()