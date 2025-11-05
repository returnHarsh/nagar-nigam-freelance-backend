import pandas as pd
from pymongo import MongoClient, errors
import json
import os
import sys
from datetime import datetime
from typing import List, Dict, Any
import logging
import random

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)  # Force output to stdout
    ]
)
logger = logging.getLogger(__name__)


# ============= CONFIGURATION =============
# Get file path from command line argument
if len(sys.argv) > 1:
    FILE_PATH = sys.argv[1]
else:
    logger.error("❌ File Path is Not present or provided")

OUTPUT_JSON = "data.json"

# Use environment variables for security
# MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://peter:qJ4XwxeBuaknmEaf@cluster0.lt1zsxj.mongodb.net/")
# DB_NAME = os.getenv("DB_NAME", "nagar_nigam")
MONGO_URI = sys.argv[2]
DB_NAME = sys.argv[3]
COLLECTION_NAME = "properties"


# ============= COLUMN MAPPING =============
REQUIRED_COLUMNS = {
    "WARD NUMBER": "wardNumber",
    "WARD NAME": "ward",
    "HOUSE_NUMBER": "houseNumber",
    "Phone number": "phoneNumber",
    "FATHER NAME": "fatherName",
    "RODE WITH TAPE- NAME": "roadWidthType",
    "CONSTRUCTION TYPE NAME": "constructionType",
    "PROPERTY TYPE NAME": "propertyType",
    "PROPERTY CATEGORY": "propertyCategory",
    "NUMBER OF FLOOR": "numberOfFloors",
    "Comment": "comment",
    "FULL NAME" : "ownerName"
}


# ============= HELPER FUNCTIONS ============
def generate_numeric_id(length=6):
    """Generate a random numeric ID of specified length"""
    return ''.join(random.choices('0123456789', k=length))


class PropertyDataProcessor:
    def __init__(self, file_path: str, mongo_uri: str, db_name: str):
        self.file_path = file_path
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.client = None
        self.db = None
        self.collection = None
        self.wardMapping = {}
        self.processed_data: List[Dict[str, Any]] = []
        self.propertyWardDetails = [],
        self.demandNumber = 0
        
    def is_duplicate(self, row):
        """Check if a property with the same ward name and house number exists"""
        ward = str(self.safe_get_value(row, "WARD", ""))        # ward name
        house_number = str(self.safe_get_value(row, "HOUSE_NUMBER", ""))  # house number

        duplicate = self.collection.find_one({
            "ward": ward,
            "houseNumber": house_number
        })
        return duplicate is not None

    


    def connect_to_mongodb(self):
        """Establish MongoDB connection with error handling"""
        try:
            self.client = MongoClient(
                self.mongo_uri,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000
            )
            # Test connection
            self.client.server_info()
            self.db = self.client[self.db_name]
            self.collection = self.db[COLLECTION_NAME]


            # ========== Fetching the count of property ==============
            self.demandNumber = self.collection.count_documents({})
            
            # Create indexes for better query performance
            # try:
            #     self.collection.create_index([("ward", 1), ("houseNumber", 1)], unique=True)
            # except errors.OperationFailure:
            #     # Index might already exist
            #     pass
            
            logger.info("✅ Successfully connected to MongoDB")
            return True
        except errors.ConnectionError as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Unexpected error during MongoDB connection: {e}")
            return False

    def validate_excel_file(self) -> bool:
        """Validate if Excel file exists and has required columns"""
        if not os.path.exists(self.file_path):
            logger.error(f"❌ File not found: {self.file_path}")
            return False
        

        # ============= need to be uncomment ================
        # try:
        #     df = pd.read_excel(self.file_path, nrows=1) # -> here The nrows parameter in pandas.read_excel() specifies the number of rows to read from the Excel file , so since we are validating the file we have to read the first row that is the heading of each columns
        #     missing_cols = [col for col in REQUIRED_COLUMNS.keys() if col not in df.columns]
            
        #     if missing_cols:
        #         logger.error(f"❌ Missing required columns: {missing_cols}")
        #         return False
            
        #     logger.info("✅ Excel file validation passed")
        #     return True
        # except Exception as e:
        #     logger.error(f"❌ Error reading Excel file: {e}")
        #     return False

        # ================ up until here ===================
        return True

    def safe_get_value(self, row: pd.Series, column: str, default=None):
        """Safely get value from row with default fallback"""
        try:
            value = row.get(column, default)
            # Handle NaN, None, empty strings
            if pd.isna(value) or value == "" or value is None:
                return default
            return value
        except Exception:
            return default

    def process_floors(self, row: pd.Series) -> List[Dict[str, float]]:
        """Process floor-wise carpet and empty areas"""
        floors = []
        num_floors = int(self.safe_get_value(row, "NUMBER OF FLOOR", 0))

        if num_floors <= 0:
            logger.warning(f"⚠️ Invalid floor count for house {row.get('HOUSE_NUMBER', 'Unknown')}")
            return floors

        commercial_empty = float(self.safe_get_value(row, "Empty_Area_Commercial", 0))
        residential_empty = float(self.safe_get_value(row, "Residential_Empty_Area", 0))

        for floor_num in range(1, num_floors + 1):
            commercial_carpet_col = f"Commercial_Coppate_Area_Floor{floor_num}"
            residential_carpet_col = f"Residential_Coppate_Area_Floor{floor_num}"

            floor_data = {
                "floorNumber": floor_num,
                "carpetAreaC": float(self.safe_get_value(row, commercial_carpet_col, 0)),
                "emptyAreaC": commercial_empty if floor_num == 1 else 0,
                "carpetAreaR": float(self.safe_get_value(row, residential_carpet_col, 0)),
                "emptyAreaR": residential_empty if floor_num == 1 else 0,
            }

            floors.append(floor_data)

        return floors

    def process_row(self, row: pd.Series):
		# First check if this data already exists on db or not
        #  ***** need to uncommect *******
        # if self.is_duplicate(row):
        #     return None

        # print("======= ROW IS : ========= " , row)
        
        # Updating the demandNumber
        self.demandNumber = self.demandNumber + 1

        """Process a single row and convert to schema format"""
        try:
            processed_row = {
                "PTIN" : f"UP{self.safe_get_value(row, 'DISTIRCT CODE', '17')}{generate_numeric_id()}",
                "ward": str(self.safe_get_value(row, "WARD NAME", "")),
                "wardNumber": str(self.safe_get_value(row, "WARD NUMBER", "")),
                "houseNumber": str(self.safe_get_value(row, "HOUSE_NUMBER", "")),
                "newHouseNumber" : str(self.safe_get_value(row , "PROPERTY SEQUENCE NUMBER" , "")),
                "phoneNumber": str(self.safe_get_value(row, "Phone number", "")),
                "fatherName": str(self.safe_get_value(row, "FATHER NAME", "")),
                "roadWidthType": str(self.safe_get_value(row, "RODE WITH TAPE- NAME", "")),
                "constructionType": str(self.safe_get_value(row, "CONSTRUCTION TYPE NAME", "")),
                "propertyType": str(self.safe_get_value(row, "PROPERTY TYPE NAME", "")),
                "propertyClass": str(self.safe_get_value(row, "PROPERTY CATEGORY", "")),
                "floorsData": {
                    "numberOfFloors": int(self.safe_get_value(row, "NUMBER OF FLOOR", 0)),
                    "floors": self.process_floors(row)
                },
                "comment": str(self.safe_get_value(row, "Comment", "")),
                "createdAt": datetime.utcnow(),
                "importedAt": datetime.utcnow(),
                "source": os.path.basename(self.file_path),
                "isProcessed" : False,
                "ownerName" : str(self.safe_get_value(row , "FULL NAME" , "")),
                "locality": str(self.propertyWardDetails.get(str(self.safe_get_value(row, "WARD NAME", "")), {}).get("locality" , [""])[0]),
                "demandNumber" : str(self.demandNumber)
            }

            return processed_row

        except Exception as e:
            logger.error(f"❌ Error processing row: {e}")
            return None

    def process_excel_file(self) -> bool:
        """Read and process entire Excel file"""
        try:
            logger.info(f"📖 Reading Excel file: {self.file_path}")
            df = pd.read_excel(self.file_path)

            # ✅ Remove leading/trailing spaces from column names
            df.columns = df.columns.str.strip()
            
            total_rows = len(df)
            logger.info(f"📊 Found {total_rows} rows to process")

            for idx, row in df.iterrows():
                processed_row = self.process_row(row)
                
                if processed_row:
                    self.processed_data.append(processed_row)
                else:
                    logger.warning(f"⚠️ Skipped row {idx + 1} , row is : {row}")
                    logger.warning(f"⚠️ Skipped row {idx + 1} , and processed_row is : =============== \n " , processed_row)

                # Progress logging for large files
                if (idx + 1) % 100 == 0:
                    logger.info(f"⏳ Processed {idx + 1}/{total_rows} rows...")

            logger.info(f"✅ Successfully processed {len(self.processed_data)}/{total_rows} rows")
            sys.stdout.flush()  # Force flush output
            return True

        except Exception as e:
            logger.error(f"❌ Error processing Excel file: {e}")
            return False

    def save_to_json(self) -> bool:
        """Save processed data to JSON file"""
        try:
            with open(OUTPUT_JSON, "w", encoding='utf-8') as f:
                json.dump(self.processed_data, f, ensure_ascii=False, indent=2, default=str)
            
            logger.info(f"✅ JSON file saved successfully: {OUTPUT_JSON}")
            return True

        except Exception as e:
            logger.error(f"❌ Error saving JSON file: {e}")
            return False

    def insert_to_mongodb(self) -> bool:
        """Insert data to MongoDB with duplicate handling"""
        if not self.processed_data:
            logger.warning("⚠️ No data to insert")
            return False

        try:
            # Use ordered=False to continue on duplicate key errors
            result = self.collection.insert_many(
                self.processed_data,
                ordered=False
            )
            
            inserted_count = len(result.inserted_ids)
            logger.info(f"✅ Successfully inserted {inserted_count} documents to MongoDB")
            sys.stdout.flush()  # Force flush output
            return True

        except errors.BulkWriteError as bwe:
            # Handle duplicate key errors
            inserted_count = bwe.details['nInserted']
            duplicate_count = len(bwe.details['writeErrors'])
            
            logger.warning(f"⚠️ Inserted: {inserted_count}, Duplicates skipped: {duplicate_count}")
            sys.stdout.flush()  # Force flush output
            
            if inserted_count > 0:
                return True
            return False

        except Exception as e:
            logger.error(f"❌ Error inserting to MongoDB: {e}")
            return False

    def close_connection(self):
        """Safely close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("🔒 MongoDB connection closed")


    def fetchPropertyWardDetails(self):
        propertyWardDetailsCollection = self.db["propertywarddetails"]
        propertyWardDetails = list(propertyWardDetailsCollection.find())
        self.propertyWardDetails = { wardDetail.get("ward", ""): wardDetail for wardDetail in propertyWardDetails }
        return propertyWardDetails

    def run(self):
        """Main execution flow"""
        try:
            logger.info("🚀 Starting property data import process...")
            logger.info(f"📁 Processing file: {self.file_path}")
            sys.stdout.flush()  # Force flush output

            # Step 1: Validate Excel file
            if not self.validate_excel_file():
                return False

            # Step 2: Connect to MongoDB
            if not self.connect_to_mongodb():
                return False


            self.fetchPropertyWardDetails()

            # Step 3: Process Excel data
            if not self.process_excel_file():
                return False

            # Step 4: Save to JSON (optional)
            # self.save_to_json()

            # Step 5: Insert to MongoDB
            success = self.insert_to_mongodb()

            logger.info("🎉 Import process completed!")
            sys.stdout.flush()  # Force flush output
            return success

        except KeyboardInterrupt:
            logger.info("⚠️ Process interrupted by user")
            return False

        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}")
            sys.stdout.flush()  # Force flush output
            return False

        finally:
            self.close_connection()


def main():
    """Entry point"""

    print("Inside the main function of python script")

    processor = PropertyDataProcessor(
        file_path=FILE_PATH,
        mongo_uri=MONGO_URI,
        db_name=DB_NAME
    )
    
    success = processor.run()
    
    if success:
        logger.info("✅ All operations completed successfully!")
        sys.exit(0)  # Exit with success code
    else:
        logger.error("❌ Some operations failed. Check logs above.")
        sys.exit(1)  # Exit with error code


if __name__ == "__main__":
    main()