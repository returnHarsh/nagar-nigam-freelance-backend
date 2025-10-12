import os
import json
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

# ========== Load environment variables ==========
load_dotenv()  # make sure you have a .env file with MONGO_URI

FILE_PATH = "karahal_ward_8.xlsx"
mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    raise ValueError("❌ Mongo URI not found. Please set MONGO_URI in your .env file.")


# ========== Floor processing helper ==========
def process_floors(row):
    floors = []
    num_floors = int(row.get("NUMBER OF FLOOR", 0) or 0)

    commercial_empty = row.get("Empty_Area_Commercial", 0) or 0
    residential_empty = row.get("Residential_Empty_Area", 0) or 0

    for floor_num in range(1, num_floors + 1):
        commercial_carpet_key = f"Commercial_Coppate_Area_Floor{floor_num}"
        residential_carpet_key = f"Residential_Coppate_Area_Floor{floor_num}"

        floor = {
            "carpetAreaC": row.get(commercial_carpet_key, 0) or 0,
            "emptyAreaC": commercial_empty if floor_num == 1 else 0,
            "carpetAreaR": row.get(residential_carpet_key, 0) or 0,
            "emptyAreaR": residential_empty if floor_num == 1 else 0,
        }

        floors.append(floor)

    return floors


# ========== Each row to structured dict ==========
def process_each_row(row):
    def safe_get(field):
        value = row.get(field)
        if pd.isna(value):
            return None
        return value

    return {
        "ward": safe_get("WARD NUMBER"),
        "houseNumber": safe_get("HOUSE_NUMBER"),
        "phoneNumber": safe_get("Phone number"),
        "fatherName": safe_get("FATHER NAME"),
        "roadWidthType": safe_get("RODE WITH TAPE- NAME"),
        "constructionType": safe_get("CONSTRUCTION TYPE NAME"),
        "propertyType": safe_get("PROPERTY TYPE NAME"),
        "propertyCategory": safe_get("PROPERTY CATEGORY"),
        "comment": safe_get("Comment"),
        "isProcessed" : False,
        "floorsData": {
            "numberOfFloors": int(row.get("NUMBER OF FLOOR", 0) or 0),
            "floors": process_floors(row),
        },
    }


# ========== Main function ==========
def main():
    try:
        print("🚀 Connecting to MongoDB...")
        client = MongoClient(mongo_uri)
        db = client["nagar_nigam"]
        # db = client[os.getenv("DB_NAME")]
        collection = db["properties"]

        print(f"📂 Reading Excel file: {FILE_PATH}")
        df = pd.read_excel(FILE_PATH).fillna("")

        print("🔄 Processing rows...")
        final_data = [process_each_row(row) for _, row in df.iterrows()]

        print(f"🧾 Writing processed data to data.json...")
        with open("data.json", "w", encoding="utf-8") as f:
            json.dump(final_data, f, ensure_ascii=False, indent=2)

        # Remove duplicates based on houseNumber
        print("🧹 Removing duplicates before inserting...")
        existing_house_numbers = set(collection.distinct("houseNumber"))
        new_data = [
            item for item in final_data
            if item["houseNumber"] not in existing_house_numbers
        ]

        if not new_data:
            print("⚠️ No new records to insert. All house numbers already exist.")
            return

        collection.insert_many(new_data)
        print(f"✅ Successfully inserted {len(new_data)} new records into MongoDB.")
        print("💾 Backup written to data.json")

    except Exception as e:
        print("❌ [ERROR] Something went wrong:", e)

    finally:
        client.close()
        print("🔒 MongoDB connection closed.")


if __name__ == "__main__":
    main()
