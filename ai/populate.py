# populate_redis.py
import os
import asyncio
import pickle
import hashlib
import logging
import random
import string
from datetime import datetime

import redis.asyncio as redis

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("RedisPopulate")

CACHE_TTL = 3600  # 1 hour


class RedisCacheManager:
    def __init__(self):
        self.redis_client = None
        self.is_connected = False

    async def initialize(self):
        try:
            self.redis_client = redis.Redis(
                host=os.getenv("REDIS_HOST", "localhost"),
                port=int(os.getenv("REDIS_PORT", 6379)),
                db=int(os.getenv("REDIS_DB", 0)),
                decode_responses=False
            )
            await self.redis_client.ping()
            self.is_connected = True
            logger.info("✅ Redis connected successfully")
        except Exception as e:
            logger.error(f"❌ Redis connection failed: {e}")
            self.is_connected = False

    async def set(self, key: str, value, ttl: int = CACHE_TTL):
        if not self.is_connected:
            return False
        try:
            serialized_value = pickle.dumps(value)
            await self.redis_client.setex(key, ttl, serialized_value)
            return True
        except Exception as e:
            logger.error(f"Redis set error for {key}: {e}")
            return False

    async def get_cache_stats(self):
        if not self.is_connected:
            return {"redis_connected": False}

        info = await self.redis_client.info()
        db_stats = {db: stats for db, stats in info.items() if db.startswith("db")}
        slowlog = await self.redis_client.slowlog_get(5)

        return {
            "redis_connected": True,
            "memory_used": info.get("used_memory_human"),
            "clients": info.get("connected_clients"),
            "ops_per_sec": info.get("instantaneous_ops_per_sec"),
            "hit_rate": round(
                info.get("keyspace_hits", 0) / max(1, (info.get("keyspace_hits", 0) + info.get("keyspace_misses", 0))) * 100,
                2
            ),
            "databases": db_stats,
            "slowlog": [
                {
                    "time": datetime.fromtimestamp(entry["start_time"]).isoformat(),
                    "duration_us": entry["duration"],
                    "command": " ".join(entry["command"])
                } for entry in slowlog
            ]
        }


async def populate_data(n=100):
    cache = RedisCacheManager()
    await cache.initialize()
    if not cache.is_connected:
        return

    logger.info(f"🚀 Populating Redis with {n} demo records...")

    for i in range(n):
        # Chat keys
        chat_msg = ''.join(random.choices(string.ascii_letters, k=10))
        chat_key = f"chat:{hash(chat_msg)}:en"
        await cache.set(chat_key, {"response": f"Reply {i}", "msg": chat_msg})

        # Translation keys
        text = f"text_{i}"
        translation_key = f"translation:fr:en:{hashlib.md5(text.encode()).hexdigest()}"
        await cache.set(translation_key, f"translation_{i}")

        # TTS keys
        tts_key = f"tts:{i}:en"
        await cache.set(tts_key, {"audio_url": f"https://example.com/{i}.mp3"})

        # Mood analysis keys
        mood = random.choice(["happy", "sad", "angry", "calm"])
        mood_key = f"mood_analysis:{mood}:{random.random():.2f}:{i}"
        await cache.set(mood_key, {"mood": mood, "confidence": round(random.random(), 2)})

    logger.info("✅ Demo data inserted successfully")


async def workbench():
    cache = RedisCacheManager()
    await cache.initialize()
    if not cache.is_connected:
        return

    while True:
        print("\n=== Redis Workbench ===")
        print("1. Cache Summary")
        print("2. List Keys (by pattern)")
        print("3. Show Key (value + TTL)")
        print("4. Slowlog")
        print("5. Exit")

        choice = input("Select option: ")
        if choice == "1":
            stats = await cache.get_cache_stats()
            print("\n--- Cache Summary ---")
            for k, v in stats.items():
                print(f"{k}: {v}")

        elif choice == "2":
            pattern = input("Enter pattern (e.g., chat:*): ")
            keys = await cache.redis_client.keys(pattern)
            print(f"Found {len(keys)} keys")
            for k in keys[:20]:
                print("-", k)

        elif choice == "3":
            key = input("Enter exact key: ")
            val = await cache.redis_client.get(key)
            ttl = await cache.redis_client.ttl(key)
            print(f"Value: {pickle.loads(val) if val else None}")
            print(f"TTL: {ttl}")

        elif choice == "4":
            stats = await cache.get_cache_stats()
            print("\n--- Slowlog ---")
            for entry in stats["slowlog"]:
                print(entry)

        elif choice == "5":
            break
        else:
            print("Invalid option")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--populate", type=int, help="Populate Redis with N records")
    parser.add_argument("--workbench", action="store_true", help="Start Redis Workbench")
    args = parser.parse_args()

    if args.populate:
        asyncio.run(populate_data(args.populate))
    elif args.workbench:
        asyncio.run(workbench())