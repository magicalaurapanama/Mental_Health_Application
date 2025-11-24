import os
import redis.asyncio as redis
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def test_redis_fixed():
    try:
        # Debug: Print environment variables
        print("Environment variables:")
        print(f"REDIS_HOST: {os.getenv('REDIS_HOST')}")
        print(f"REDIS_PORT: {os.getenv('REDIS_PORT')}")
        print(f"REDIS_DB: {os.getenv('REDIS_DB')}")
        print(f"REDIS_USERNAME: {os.getenv('REDIS_USERNAME')}")
        print(f"REDIS_PASSWORD: {'*' * len(os.getenv('REDIS_PASSWORD', ''))}")
        
        # Convert port to integer with error handling
        try:
            redis_port = int(os.getenv("REDIS_PORT", "15199"))
        except ValueError:
            print(f"❌ Invalid REDIS_PORT: {os.getenv('REDIS_PORT')}")
            return
        
        redis_db = int(os.getenv("REDIS_DB", "0"))
        
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST"),
            port=redis_port,
            db=redis_db,
            username=os.getenv("REDIS_USERNAME"),
            password=os.getenv("REDIS_PASSWORD"),
            decode_responses=False
        )
        
        # Test connection
        await redis_client.ping()
        print("✅ Redis Cloud connection successful!")
        
        # Test basic operations
        await redis_client.set("test_key", "Hello Redis Cloud!")
        value = await redis_client.get("test_key")
        print(f"✅ Redis set/get test passed: {value.decode() if value else 'None'}")
        
        await redis_client.close()
        
    except Exception as e:
        print(f"❌ Redis Cloud connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_redis_fixed())