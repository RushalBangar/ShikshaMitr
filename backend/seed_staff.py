import asyncio
import os
import certifi
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://rushalbangar19_db_user:W30e1Kd9kThlFnj0@shikshamitr.ooe5ymf.mongodb.net/?retryWrites=true&w=majority")

ACCOUNTS = [
    {
        "email": "rushikeshkhalkar391@gmail.com",
        "username": "rushikeshkhalkar391@gmail.com",
        "password": "Rushi#963"
    },
    {
        "email": "ghotekarabhay0@gmail.com",
        "username": "ghotekarabhay0@gmail.com",
        "password": "Mauli@123"
    },
    {
        "email": "rupeshmarkand7@gmail.com",
        "username": "rupeshmarkand7@gmail.com",
        "password": "!!RushAl@145"
    },
    {
        "email": "rushalbangar19@gmail.com",
        "username": "rushalbangar19@gmail.com",
        "password": "Morya@123"
    }
]

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def seed_accounts():
    client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    db = client.shikshamitr
    
    print("Seeding faculty staff accounts into MongoDB Atlas...")
    
    for account in ACCOUNTS:
        email = account["email"].strip().lower()
        username = account["username"].strip()
        hashed_password = get_password_hash(account["password"])
        
        doc = {
            "email": email,
            "username": username,
            "password_hash": hashed_password
        }
        
        # Upsert by email or username
        result = await db.staff.update_one(
            {"$or": [{"email": email}, {"username": username}]},
            {"$set": doc},
            upsert=True
        )
        print(f" - Account '{email}': matched={result.matched_count}, modified={result.modified_count}, upserted_id={result.upserted_id}")

    print("All faculty accounts seeded successfully!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_accounts())
