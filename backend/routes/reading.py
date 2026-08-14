from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models import ReadingLessonModel
from routes.auth import get_current_user
import main

router = APIRouter()

@router.get("/reading", response_model=List[ReadingLessonModel])
async def get_reading_lessons(level: Optional[int] = None):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    query = {}
    if level:
        query["level"] = level
        
    lessons = []
    cursor = main.db.reading_lessons.find(query)
    async for document in cursor:
        document["id"] = str(document["_id"])
        lessons.append(ReadingLessonModel(**document))
        
    return lessons

@router.post("/reading", response_model=ReadingLessonModel)
async def create_reading_lesson(lesson: ReadingLessonModel, current_user: dict = Depends(get_current_user)):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    lesson_dict = lesson.dict(by_alias=True, exclude={"id"})
    result = await main.db.reading_lessons.insert_one(lesson_dict)
    
    created_lesson = await main.db.reading_lessons.find_one({"_id": result.inserted_id})
    created_lesson["id"] = str(created_lesson["_id"])
    return ReadingLessonModel(**created_lesson)
