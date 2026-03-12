from pymongo import MongoClient
import os
from dotenv import load_dotenv
load_dotenv()

SOURCE_URI = os.getenv("MONGODB_URI")
TARGET_URI = os.getenv("CLONE_URI")

SOURCE_DB_NAME = os.getenv("DB_NAME")
TARGET_DB_NAME = os.getenv("DB_NAME")

BATCH_SIZE = 1000


def clone_database():
    source_client = MongoClient(SOURCE_URI)
    target_client = MongoClient(TARGET_URI)

    source_db = source_client[SOURCE_DB_NAME]
    target_db = target_client[TARGET_DB_NAME]

    collections = source_db.list_collection_names()

    for collection_name in collections:
        print(f"Cloning collection: {collection_name}")

        source_collection = source_db[collection_name]
        target_collection = target_db[collection_name]

        cursor = source_collection.find({})
        batch = []

        for document in cursor:
            batch.append(document)

            if len(batch) >= BATCH_SIZE:
                target_collection.insert_many(batch, ordered=False)
                batch = []

        if batch:
            target_collection.insert_many(batch, ordered=False)

        print(f"Finished cloning {collection_name}")

    print("✅ Database cloning completed.")


if __name__ == "__main__":
    clone_database()