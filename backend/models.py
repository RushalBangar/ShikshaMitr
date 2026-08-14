from pydantic import BaseModel, Field
from typing import Optional

class MaterialModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    type: str # 'board_paper', 'practice_paper', 'notes'
    subject: str
    standard: int # e.g., 5, 10
    url: str

    class Config:
        populate_by_name = True

class ReadingLessonModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    level: int # 1, 2, 3 etc. for difficulty
    word: str
    sentence: str
    
    class Config:
        populate_by_name = True
