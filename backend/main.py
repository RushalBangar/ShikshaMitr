from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="ShikshaMitr API")

# Setup CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = None
db = None

@app.on_event("startup")
async def startup_db_client():
    global client, db
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.shikshamitr
    print("Connected to MongoDB!")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    print("Closed MongoDB connection.")

@app.get("/")
async def root():
    return {"message": "Welcome to ShikshaMitr API"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "db_connected": client is not None}
