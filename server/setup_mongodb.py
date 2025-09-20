"""
MongoDB Vector Search Index Setup Script
This script helps set up the vector search index for the educational AI application
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

def create_vector_search_index():
    """Create vector search index for MongoDB Atlas"""
    
    # Get MongoDB connection details
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    db_name = os.getenv('MONGODB_DB_NAME', 'educational_ai')
    collection_name = os.getenv('MONGODB_COLLECTION_NAME', 'documents')
    
    print("🔍 MongoDB Vector Search Index Setup")
    print("=" * 40)
    print(f"Database: {db_name}")
    print(f"Collection: {collection_name}")
    print(f"URI: {mongodb_uri.split('@')[-1] if '@' in mongodb_uri else mongodb_uri}")
    print()
    
    try:
        # Connect to MongoDB
        client = MongoClient(mongodb_uri)
        
        # Test connection
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB")
        
        # Get database and collection
        db = client[db_name]
        collection = db[collection_name]
        
        # Vector search index definition
        vector_index_definition = {
            "name": "vector_index",
            "definition": {
                "fields": [
                    {
                        "type": "vector",
                        "path": "embedding",
                        "numDimensions": 768,
                        "similarity": "cosine"
                    },
                    {
                        "type": "filter",
                        "path": "source"
                    }
                ]
            }
        }
        
        print("📝 Vector Search Index Definition:")
        print(json.dumps(vector_index_definition, indent=2))
        print()
        
        # Note: Atlas search indexes need to be created through Atlas UI or Atlas CLI
        print("⚠️  IMPORTANT: Vector Search Index Setup")
        print("=" * 40)
        print("For MongoDB Atlas, you need to create the vector search index manually:")
        print()
        print("1. Go to your MongoDB Atlas dashboard")
        print("2. Navigate to your cluster")
        print("3. Go to 'Search' tab")
        print("4. Click 'Create Search Index'")
        print("5. Choose 'Atlas Vector Search'")
        print("6. Use the following configuration:")
        print()
        print("Index Name: vector_index")
        print("Database:", db_name)
        print("Collection:", collection_name)
        print()
        print("JSON Editor Configuration:")
        print(json.dumps(vector_index_definition["definition"], indent=2))
        print()
        
        # Create a sample document to test the collection
        sample_doc = {
            "text": "This is a sample document for testing the MongoDB setup.",
            "source": "setup_test",
            "metadata": {
                "created_by": "setup_script",
                "purpose": "testing"
            }
        }
        
        # Insert sample document
        result = collection.insert_one(sample_doc)
        print(f"✅ Sample document inserted with ID: {result.inserted_id}")
        
        # Check collection stats
        doc_count = collection.count_documents({})
        print(f"📊 Collection '{collection_name}' has {doc_count} document(s)")
        
        print()
        print("🚀 Next Steps:")
        print("1. Create the vector search index in MongoDB Atlas (see instructions above)")
        print("2. Wait for the index to be built (this may take a few minutes)")
        print("3. Run your Flask application: python app.py")
        print("4. Test the educational features")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print()
        print("💡 Troubleshooting:")
        print("- Check your MongoDB URI in the .env file")
        print("- Ensure MongoDB is running (for local instances)")
        print("- Verify network connectivity to MongoDB Atlas")
        print("- Check authentication credentials")

def check_existing_indexes():
    """Check what indexes already exist"""
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    db_name = os.getenv('MONGODB_DB_NAME', 'educational_ai')
    collection_name = os.getenv('MONGODB_COLLECTION_NAME', 'documents')
    
    try:
        client = MongoClient(mongodb_uri)
        collection = client[db_name][collection_name]
        
        indexes = list(collection.list_indexes())
        print("📋 Existing Indexes:")
        for idx in indexes:
            print(f"  - {idx['name']}: {idx.get('key', 'N/A')}")
        
        return indexes
    except Exception as e:
        print(f"❌ Error checking indexes: {str(e)}")
        return []

def main():
    """Main setup function"""
    print("🎓 Educational AI - MongoDB Setup")
    print("=" * 50)
    
    # Check if environment file exists
    if not os.path.exists('.env'):
        print("⚠️  .env file not found. Creating from template...")
        if os.path.exists('.env.example'):
            import shutil
            shutil.copy('.env.example', '.env')
            print("✅ .env file created from .env.example")
            print("📝 Please edit .env file and add your Google API key and MongoDB URI")
            return
        else:
            print("❌ .env.example file not found")
            return
    
    # Check for required environment variables
    required_vars = ['GOOGLE_API_KEY', 'MONGODB_URI']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("⚠️  Missing required environment variables:")
        for var in missing_vars:
            print(f"  - {var}")
        print("Please add these to your .env file before proceeding.")
        return
    
    print("✅ Environment variables configured")
    print()
    
    # Check existing indexes
    check_existing_indexes()
    print()
    
    # Create vector search index (or show instructions)
    create_vector_search_index()

if __name__ == "__main__":
    main()