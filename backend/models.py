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

class ForumPostModel(BaseModel):
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=5000)
    subject: str = Field(..., max_length=50)

class ForumReplyModel(BaseModel):
    content: str = Field(..., max_length=5000)

class FlashcardModel(BaseModel):
    front: str = Field(..., max_length=500)
    back: str = Field(..., max_length=500)

class FlashcardDeckModel(BaseModel):
    title: str = Field(..., max_length=150)
    subject: str = Field(..., max_length=50)
    cards: list[FlashcardModel] = Field(..., max_items=200)

class FlashcardReviewModel(BaseModel):
    rating: int # 1 to 5
