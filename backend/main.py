from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
import os
import certifi
from dotenv import load_dotenv

from routes import materials, reading, auth, files, quizzes, ws, student, faculty, forum, flashcards

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017").strip()
client = None
db = None
db_connected = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db, db_connected
    try:
        # Instantiate AsyncIOMotorClient within running event loop
        client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        db = client.shikshamitr
        db_connected = True
        print("Successfully connected to MongoDB Atlas!")
    except Exception as e:
        db_connected = False
        print(f"Could not connect to MongoDB Atlas: {e}")
    
    yield
    
    if client:
        client.close()
        print("Closed MongoDB connection.")

app = FastAPI(title="ShikshaMitr API", lifespan=lifespan)

# Setup CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(materials.router, prefix="/api", tags=["materials"])
app.include_router(reading.router, prefix="/api", tags=["reading"])
app.include_router(quizzes.router, prefix="/api", tags=["quizzes"])
app.include_router(student.router, prefix="/api", tags=["student"])
app.include_router(faculty.router, prefix="/api", tags=["faculty"])
app.include_router(forum.router, prefix="/api/forum", tags=["forum"])
app.include_router(flashcards.router, prefix="/api/flashcards", tags=["flashcards"])
app.include_router(ws.router, tags=["websocket"])

@app.get("/")
async def root():
    return {"message": "Welcome to ShikshaMitr API"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok", 
        "db_connected": db_connected,
        "message": "Connected to MongoDB Atlas!" if db_connected else "MongoDB connection pending"
    }
