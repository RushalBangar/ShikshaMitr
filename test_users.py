import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb+srv://rushalbangar19_db_user:Morya123@shikshamitr.ooe5ymf.mongodb.net/?retryWrites=true&w=majority')
    db = client.shikshamitr
    staff = await db.staff.find({}, {"password_hash": 0}).to_list(10)
    students = await db.students.find({}, {"password_hash": 0}).to_list(10)
    print("Staff:", staff)
    print("Students:", students)
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
