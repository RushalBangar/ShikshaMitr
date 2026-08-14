import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    client = AsyncIOMotorClient('mongodb+srv://rushalbangar19_db_user:Morya123@shikshamitr.ooe5ymf.mongodb.net/?retryWrites=true&w=majority')
    db = client.shikshamitr
    materials = await db.materials.find().to_list(length=100)
    for m in materials:
        print(m)
    client.close()

if __name__ == '__main__':
    asyncio.run(test())
