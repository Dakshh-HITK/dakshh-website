import os
from pymongo import MongoClient
from dotenv import load_dotenv
from data import seminars_data

# Load environment variables from .env file
load_dotenv()

# Configuration
MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = "Seminar"

def seed():
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI)
        db = client[DATABASE_NAME]
        collection = db[COLLECTION_NAME]
        
        print("✅ MongoDB Connected")

        for seminar in seminars_data:
            # Check if record already exists by title
            exists = collection.find_one({"title": seminar["title"]})

            if not exists:
                collection.insert_one(seminar)
                print(f"✅ Added: {seminar['title']}")
            else:
                print(f"⚠️ Already exists: {seminar['title']}")

        print("🚀 Seeding completed!")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    seed()