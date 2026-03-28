import asyncio
import os
import motor.motor_asyncio
import json
import argparse
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
def get_mongo_uri():
    """Get the MongoDB URI from environment variables with better error handling."""
    mongo_uri = os.getenv("MONGODB_URI")
    
    if not mongo_uri:
        # Use a default connection string
        mongo_uri = "mongodb://localhost:27017"
        print(f"MONGODB_URI environment variable not set. Using default: {mongo_uri}")
        print("Note: If you're using MongoDB Atlas, you need to provide the full connection string.")
        print("Example: mongodb+srv://username:password@cluster.mongodb.net/dbname")
        print("You can specify using --uri parameter: python init_patent_guidelines.py --uri=\"your-connection-string\"")
    
    return mongo_uri

def get_database_name():
    return os.getenv("MONGODB_DATABASE", "legalvoice")

# Patent guidelines data
patent_guidelines = {
  "patentWritingGuidelines": {
    "title": {
      "description": "Brief title for the invention",
      "requirements": [
        "Should be free from fancy expressions or ambiguity",
        "Should be precise and definite",
        "Should not exceed 15 words"
      ]
    },
    "fieldOfInvention": {
      "description": "The technical area to which the invention belongs",
      "requirements": [
        "Should explain advantages of the invention",
        "Should provide evidence to support industrial applicability"
      ]
    },
    "backgroundOfInvention": {
      "description": "Similar to literature survey",
      "requirements": [
        "Describe existing technologies and their limitations",
        "Clearly distinguish your invention from closest prior art"
      ]
    },
    "objectsOfInvention": {
      "description": "Technical problems and solutions",
      "requirements": [
        "Clearly mention technical problems with existing technology",
        "Describe the solution provided by the invention",
        "Highlight differences between claimed invention and prior art"
      ]
    },
    "summaryOfInvention": {
      "description": "Concise overview of the invention",
      "requirements": [
        "Should provide a summary before detailed description",
        "Should highlight key aspects and benefits"
      ]
    },
    "briefDescriptionOfDrawings": {
      "description": "Explanation of what each figure represents",
      "example": "Figure 1 is the 3D model of the proposed invention"
    },
    "detailedDescription": {
      "description": "Complete explanation of the invention",
      "requirements": [
        "Should contain sufficient detail to give complete picture of invention",
        "Should use bullet points and be precise",
        "Should enable a person skilled in the art to replicate the invention"
      ]
    },
    "claims": {
      "description": "Defines legal scope of protection sought",
      "importance": "Very important part of patent writing",
      "notes": [
        "Technical facts expressed in legal terms defining the scope of invention",
        "What is not claimed stands disclaimed and is open to public use",
        "Claims must be clear, concise and supported by description"
      ]
    },
    "figures": {
      "description": "Technical drawings of the invention",
      "requirements": [
        "Should be on A4 size sheets",
        "Clear margin of at least 4 cm on top and left, 3 cm at bottom and right",
        "Dimensions should not be marked on drawing",
        "Drawings must be sequentially or systematically numbered at right hand bottom corner"
      ]
    },
    "abstract": {
      "description": "Brief summary of the invention",
      "requirements": [
        "Should not exceed 150 words",
        "Should specify technical field of invention",
        "Should identify technical problem and its solution",
        "Should indicate potential end users or applications"
      ]
    }
  },
  "filingProcedure": {
    "requiredForms": [
      {
        "name": "Form 1",
        "description": "Application for Grant of Patent",
        "fee": "1750 (physical filing)"
      },
      {
        "name": "Form 2",
        "description": "Complete Specification"
      },
      {
        "name": "Form 3",
        "description": "Statement and Undertaking Under Section 8"
      },
      {
        "name": "Form 5",
        "description": "Declaration as to Inventorship"
      },
      {
        "name": "Form 9",
        "description": "Request for Publication",
        "fee": "2750"
      },
      {
        "name": "Form 18A",
        "description": "Request/Express Request for Examination of Application for Patent",
        "fee": "4400"
      }
    ],
    "additionalFees": [
      {
        "description": "Per claim more than 10",
        "fee": "350"
      },
      {
        "description": "For each sheet of specification in addition to 30",
        "fee": "180"
      }
    ]
  },
  "patentResources": {
    "searchPortals": [
      {
        "name": "Espacenet",
        "url": "https://worldwide.espacenet.com/",
        "description": "Global patent search portal"
      },
      {
        "name": "Indian Patent Office",
        "url": "http://www.ipindia.nic.in/",
        "description": "Official portal for Indian patents"
      }
    ],
    "trackingApplication": "After submission, check for published patent weekly in the Indian patent office journal"
  },
  "importantNotes": {
    "exclusiveRights": "Patents provide exclusive rights to the inventor",
    "returns": "Patents can provide higher returns on investments",
    "licensing": "Patents offer opportunity to license or sell the invention"
  }
}

async def init_patent_guidelines(mongo_uri=None, db_name=None):
    """Initialize patent guidelines in the MongoDB database"""
    if mongo_uri is None:
        mongo_uri = get_mongo_uri()
    if db_name is None:
        db_name = get_database_name()
    
    print(f"Connecting to MongoDB at {mongo_uri}...")
    try:
        # Set a shorter timeout for quicker feedback
        client = motor.motor_asyncio.AsyncIOMotorClient(
            mongo_uri, 
            serverSelectionTimeoutMS=5000
        )
        
        # Test the connection before proceeding
        await client.admin.command('ping')
        print("Successfully connected to MongoDB")
        
        db = client[db_name]
        
        # Check if guidelines already exist
        existing = await db.document_template_guidelines.find_one({"document_type": "patent"})
        
        if existing:
            print("Patent guidelines already exist in database. Updating...")
            await db.document_template_guidelines.update_one(
                {"document_type": "patent"},
                {
                    "$set": {
                        "guidelines": patent_guidelines,
                        "version": existing.get("version", 1) + 1,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            print(f"Patent guidelines updated to version {existing.get('version', 1) + 1}")
        else:
            print("Adding patent guidelines to database...")
            await db.document_template_guidelines.insert_one({
                "document_type": "patent",
                "guidelines": patent_guidelines,
                "version": 1,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            print("Patent guidelines added to database")
        
        print("Operation completed successfully!")
    except Exception as e:
        print(f"Error: {str(e)}")
        print("\nTroubleshooting tips:")
        print("1. Ensure MongoDB is running and accessible")
        print("2. Check your connection string")
        print("3. Verify network connectivity")
        print("4. Make sure authentication credentials are correct")
        return False
    
    return True

def parse_arguments():
    parser = argparse.ArgumentParser(description="Initialize patent guidelines in MongoDB")
    parser.add_argument("--uri", help="MongoDB URI (overrides .env file)")
    parser.add_argument("--db", help="Database name (overrides .env file)")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_arguments()
    
    # Use command line args if provided, otherwise use environment variables
    mongo_uri = args.uri or get_mongo_uri()
    db_name = args.db or get_database_name()
    
    print(f"Using database: {db_name}")
    
    success = asyncio.run(init_patent_guidelines(mongo_uri, db_name))
    
    if not success:
        sys.exit(1)  # Exit with error code if failed 