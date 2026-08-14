import asyncio
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket

async def test():
    client = AsyncIOMotorClient('mongodb+srv://rushalbangar19_db_user:Morya123@shikshamitr.ooe5ymf.mongodb.net/?retryWrites=true&w=majority')
    db = client.shikshamitr
    fs = AsyncIOMotorGridFSBucket(db)
    
    grid_in = fs.open_upload_stream('test.pdf', metadata={'content_type': 'application/pdf'})
    await grid_in.write(b'test')
    await grid_in.close()
    print('success')
    client.close()

if __name__ == '__main__':
    asyncio.run(test())
