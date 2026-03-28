import os
import motor.motor_asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# MongoDB connection URI and database name from environment
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("MONGODB_DATABASE", "legalvoice")

# Default timeout values
DEFAULT_CONNECTION_TIMEOUT_MS = 5000
DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 5000

# Global client reference to reuse connection
_client = None

async def get_mongodb_client(
    uri=None, 
    connection_timeout_ms=DEFAULT_CONNECTION_TIMEOUT_MS, 
    server_selection_timeout_ms=DEFAULT_SERVER_SELECTION_TIMEOUT_MS
):
    """Get a MongoDB client with connection pooling"""
    global _client
    
    if _client is None:
        try:
            mongo_uri = uri or MONGODB_URI
            logger.info(f"Connecting to MongoDB at {mongo_uri}")
            
            # Create a new client with timeouts
            _client = AsyncIOMotorClient(
                mongo_uri,
                connectTimeoutMS=connection_timeout_ms,
                serverSelectionTimeoutMS=server_selection_timeout_ms
            )
            
            # Test the connection with a ping command
            await _client.admin.command('ping')
            logger.info("Successfully connected to MongoDB")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            _client = None
            raise
    
    return _client

async def get_db(db_name=None):
    """Get a MongoDB database instance with connection management"""
    client = await get_mongodb_client()
    if client is None:
        raise ConnectionError("Failed to establish MongoDB connection")
    
    database_name = db_name or DATABASE_NAME
    return client[database_name]

async def safe_db_operation(operation, fallback=None):
    """
    Safely execute a database operation with error handling
    
    Args:
        operation: An async function that performs a database operation
        fallback: A value to return if the operation fails
        
    Returns:
        The result of the operation, or the fallback value if it fails
    """
    try:
        return await operation()
    except Exception as e:
        logger.error(f"Database operation failed: {str(e)}")
        return fallback 