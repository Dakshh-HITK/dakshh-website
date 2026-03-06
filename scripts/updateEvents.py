from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# -------------------------------
# MongoDB Connection
# -------------------------------
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

client = MongoClient(MONGODB_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

MAX_SAFE_INTEGER = 9007199254740991

events = [
    {"eventName": "Brainstorm", "teamLimit": MAX_SAFE_INTEGER},
    {"eventName": "TechTussle", "teamLimit": MAX_SAFE_INTEGER},
    {"eventName": "HydroLaunch", "teamLimit": MAX_SAFE_INTEGER},
    {"eventName": "Robo Dangal", "teamLimit": MAX_SAFE_INTEGER},
    {"eventName": "Robo War", "teamLimit": 20}, #ok
    {"eventName": "Robo Race", "teamLimit": 20}, #ok
    {"eventName": "Solve the Maze", "teamLimit": 35}, #ok
    {"eventName": "Circuitrix", "teamLimit": 45}, #ok
    {"eventName": "VALORANT", "teamLimit": MAX_SAFE_INTEGER},
    {"eventName": "BGMI", "teamLimit": MAX_SAFE_INTEGER},
    {"eventName": "Hack Among Us", "teamLimit": 80},
    {"eventName": "ModelForge", "teamLimit": 20},
    {"eventName": "Skeld Sprint", "teamLimit": 60},
    {"eventName": "Modelworks", "teamLimit": 60},
    {"eventName": "Quiz Tank", "teamLimit": 65},
    {"eventName": "Startup Expo", "teamLimit": 80},
    {"eventName": "Loadrix", "teamLimit": 40},
    {"eventName": "CADventure", "teamLimit": 55},
    {"eventName": "novaTechX", "teamLimit": 35},
    {"eventName": "Sci-Charades", "teamLimit": MAX_SAFE_INTEGER},
    {"eventName": "Vibe-A-Thon", "teamLimit": 80},
    {"eventName": "Mélange", "teamLimit": 65}, #ok
    {"eventName": "AI Protosprint", "teamLimit": 65}, #ok
    {"eventName": "Capture The Flag", "teamLimit": MAX_SAFE_INTEGER}, #ok
]

# -------------------------------
# Update Existing Documents Only
# -------------------------------
for event in events:
    result = collection.update_one(
        {"eventName": event["eventName"]},  # find condition
        {"$set": {"teamLimit": event["teamLimit"]}}  # update
    )

    if result.matched_count > 0:
        print(f"Updated: {event['eventName']}")
    else:
        print(f"Not Found: {event['eventName']}")

client.close()