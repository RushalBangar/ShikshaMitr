from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models import ReadingLessonModel
from routes.auth import get_current_user
from security import rate_limiter
import main

router = APIRouter()

@router.get("/reading")
async def get_reading_lessons(level: Optional[int] = None):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    query = {}
    if level:
        query["level"] = level
        
    lessons = []
    cursor = main.db.reading_lessons.find(query)
    async for document in cursor:
        doc_id = str(document["_id"])
        document["_id"] = doc_id
        document["id"] = doc_id
        lessons.append(document)
        
    return lessons

@router.post("/reading")
async def create_reading_lesson(lesson: ReadingLessonModel, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can perform this action")
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    lesson_dict = lesson.dict(by_alias=True, exclude={"id"})
    result = await main.db.reading_lessons.insert_one(lesson_dict)
    
    created_lesson = await main.db.reading_lessons.find_one({"_id": result.inserted_id})
    doc_id = str(created_lesson["_id"])
    created_lesson["_id"] = doc_id
    created_lesson["id"] = doc_id
    return created_lesson

@router.post("/reading/complete", dependencies=[Depends(rate_limiter(max_requests=2, window_seconds=60))])
async def complete_reading_lesson(current_user: dict = Depends(get_current_user)):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    if current_user.get("role") != "student":
        return {"message": "Points only awarded to students", "points": 0}
        
    username = current_user.get("username")
    
    # Award 10 points for completing a reading lesson
    await main.db.students.update_one(
        {"username": username},
        {"$inc": {"community_points": 10}}
    )
    
    return {"message": "Reading lesson completed", "points_awarded": 10}
