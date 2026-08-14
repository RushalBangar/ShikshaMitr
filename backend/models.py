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

class MaterialUpdateModel(BaseModel):
    title: str

class ReadingLessonModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    level: int # 1, 2, 3 etc. for difficulty
    word: str
    sentence: str
    
    class Config:
        populate_by_name = True

class QuizQuestionModel(BaseModel):
    question: str
    options: list[str]
    correct_option: int # Index of correct option (0, 1, 2, 3)
    explanation: Optional[str] = None

class QuizModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    subject: str
    standard: int
    questions: list[QuizQuestionModel]
    
    class Config:
        populate_by_name = True

class QuizSubmissionModel(BaseModel):
    quiz_id: str
    answers: list[int]

