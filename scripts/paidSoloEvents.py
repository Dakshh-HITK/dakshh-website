import pandas as pd
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")
EXCEL_FILE = "solo.xlsx"

def update_solo_registrations_with_payment_check():
    # 1. Connect to MongoDB
    client = MongoClient(MONGODB_URI)
    db = client[DB_NAME]
    
    # Collections
    events_col = db["events"]
    users_col = db["users"]
    registrations_col = db["registrations"]

    # 2. Read Excel
    try:
        df = pd.read_excel(EXCEL_FILE)
    except Exception as e:
        print(f"Error reading Excel: {e}")
        return

    # Check if necessary columns exist in the Excel file at all
    required_columns = ['Email', 'EventName', 'Payment_id', 'Order_id']
    if not all(col in df.columns for col in required_columns):
        print(f"Error: Excel is missing one of the required columns: {required_columns}")
        return

    for index, row in df.iterrows():
        email = str(row['Email']).strip().lower()
        event_name = str(row['EventName']).strip()
        
        # 3. Payment & Order ID Validation
        payment_id = row['Payment_id']
        order_id = row['Order_id']

        # Check if both exist (not NaN, not None, not empty string)
        is_payment_valid = pd.notna(payment_id) and str(payment_id).strip() != ""
        is_order_valid = pd.notna(order_id) and str(order_id).strip() != ""

        if not (is_payment_valid and is_order_valid):
            print(f"\n[SKIP] Row {index + 2}: User '{email}' - Missing Payment ID or Order ID.")
            continue

        print(f"\n[PROCESS] Row {index + 2}: User '{email}' for Event '{event_name}'...")

        # 4. Find User ID by Email
        user = users_col.find_one({"email": email})
        if not user:
            print(f"  [!] User not found with email: {email}")
            continue
        user_id = user['_id']

        # 5. Find Event ID by Name
        event = events_col.find_one({"eventName": event_name})
        if not event:
            print(f"  [!] Event not found: {event_name}")
            continue
        event_id = event['_id']

        # 6. Update Registration
        # Only verify if it's a solo registration (isInTeam: False)
        result = registrations_col.update_one(
            {
                "participant": user_id,
                "eventId": event_id,
                "isInTeam": False
            },
            {
                "$set": {
                    "verified": True
                    # If you want to store these IDs in the DB, uncomment below:
                    # "paymentId": payment_id,
                    # "orderId": order_id
                }
            }
        )

        if result.matched_count > 0:
            if result.modified_count > 0:
                print(f"  [+] Success: Set verified to True (Payment IDs verified).")
            else:
                print(f"  [-] Info: Already verified.")
        else:
            print(f"  [!] No registration record found for this User/Event combo.")

    print("\n--- Processing Complete ---")
    client.close()

if __name__ == "__main__":
    update_solo_registrations_with_payment_check()