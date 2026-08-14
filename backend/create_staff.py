import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os

from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is not set. Please set MONGO_URI in your .env file.")

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    return bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

async def create_staff(username, password):
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.shikshamitr
    
    # Check if user already exists
    existing = await db.staff.find_one({"username": username})
    if existing:
        print(f"Error: Staff member '{username}' already exists.")
        return

    # Insert new user
    hashed_password = get_password_hash(password)
    await db.staff.insert_one({
        "username": username,
        "password_hash": hashed_password
    })
    
    print(f"Success: Staff member '{username}' created successfully!")
    client.close()

if __name__ == "__main__":
    print("--- ShikshaMitr Staff Creation ---")
    username = input("Enter new staff username: ").strip()
    password = input("Enter new staff password: ").strip()
    
    if username and password:
        asyncio.run(create_staff(username, password))
    else:
        print("Username and password cannot be empty.")
