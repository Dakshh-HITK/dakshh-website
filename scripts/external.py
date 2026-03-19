from pymongo import MongoClient
import pandas as pd
import re
import os
from dotenv import load_dotenv

load_dotenv()

# -----------------------------
# MongoDB Connection
# -----------------------------
SOURCE_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")

if not SOURCE_URI or not DB_NAME:
    raise Exception("MONGODB_URI or DB_NAME environment variable not set")

# -----------------------------
# Mongo Connection
# -----------------------------
client = MongoClient(SOURCE_URI)
db = client[DB_NAME]

registrations = db["registrations"]
users = db["users"]

# -----------------------------
# College Normalization
# -----------------------------
def normalize_college(college):
    if not college:
        return ""

    college = college.lower()

    # remove punctuation
    college = re.sub(r"[^a-z0-9\s]", "", college)

    # collapse spaces
    college = re.sub(r"\s+", " ", college).strip()

    return college


def is_heritage(college):
    college = normalize_college(college)

    heritage_patterns = [
        "heritage institute of technology",
        "heritage institute technology",
        "heritage technology",
        "heritage",
        "hitk",
        "hit",
        "heritage institute",
    ]

    for pattern in heritage_patterns:
        if pattern in college:
            return True

    return False


# -----------------------------
# Get unique registered users
# -----------------------------
registered_user_ids = registrations.distinct("participant")

users_data = users.find(
    {"_id": {"$in": registered_user_ids}},
    {
        "username": 1,
        "email": 1,
        "fullName": 1,
        "phoneNumber": 1,
        "college": 1,
        "stream": 1
    }
)

filtered_users = []

for user in users_data:

    college = user.get("college", "")

    if not is_heritage(college):
        filtered_users.append({
            "Name": user.get("fullName"),
            "Username": user.get("username"),
            "Email": user.get("email"),
            "Phone": user.get("phoneNumber"),
            "College": college,
            "Stream": user.get("stream")
        })


# -----------------------------
# Convert to Excel
# -----------------------------
df = pd.DataFrame(filtered_users)

df.to_excel("external_participants.xlsx", index=False)

print("Excel file generated: external_participants.xlsx")
print("Total external participants:", len(df))