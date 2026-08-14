import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import os

# Uses the same MongoDB URI as main.py
MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb+srv://rushalbangar19_db_user:W30e1Kd9kThlFnj0@shikshamitr.ooe5ymf.mongodb.net")

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    return bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

async def create_staff(username, password):
    client = AsyncIOMotorClient(MONGODB_URI)
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
