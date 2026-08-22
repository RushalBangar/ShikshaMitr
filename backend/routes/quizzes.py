from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from bson.objectid import ObjectId
from models import QuizModel, QuizSubmissionModel
from routes.auth import get_current_user
from routes.ws import manager
from security import rate_limiter
import main

router = APIRouter()

@router.get("/quizzes")
async def get_quizzes(standard: Optional[int] = None, subject: Optional[str] = None):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    query = {}
    if standard:
        query["standard"] = standard
    if subject:
        query["subject"] = subject
        
    quizzes = []
    cursor = main.db.quizzes.find(query)
    async for document in cursor:
        doc_id = str(document["_id"])
        document["_id"] = doc_id
        document["id"] = doc_id
        quizzes.append(document)
        
    return quizzes

@router.get("/quizzes/{quiz_id}")
async def get_quiz(quiz_id: str):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
    try:
        obj_id = ObjectId(quiz_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid quiz ID")
        
    quiz = await main.db.quizzes.find_one({"_id": obj_id})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    doc_id = str(quiz["_id"])
    quiz["_id"] = doc_id
    quiz["id"] = doc_id
    return quiz

@router.post("/quizzes")
async def create_quiz(quiz: QuizModel, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can perform this action")
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    quiz_dict = quiz.dict(by_alias=True, exclude={"id"})
    result = await main.db.quizzes.insert_one(quiz_dict)
    
    created_quiz = await main.db.quizzes.find_one({"_id": result.inserted_id})
    doc_id = str(created_quiz["_id"])
    created_quiz["_id"] = doc_id
    created_quiz["id"] = doc_id
    
    # Broadcast real-time WebSocket notification to all active students
    await manager.broadcast({
        "type": "NEW_QUIZ",
        "title": quiz.title,
        "subject": quiz.subject,
        "standard": quiz.standard,
        "message": f"🎯 New {quiz.subject} Quiz available for Class {quiz.standard}: {quiz.title}"
    })
    
    return created_quiz

@router.delete("/quizzes/{quiz_id}")
async def delete_quiz(quiz_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can perform this action")
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
    try:
        obj_id = ObjectId(quiz_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid quiz ID")
        
    res = await main.db.quizzes.delete_one({"_id": obj_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return {"message": "Quiz deleted successfully"}

@router.post("/quizzes/{quiz_id}/submit", dependencies=[Depends(rate_limiter(max_requests=10, window_seconds=60))])
async def submit_quiz(quiz_id: str, submission: QuizSubmissionModel, current_user: dict = Depends(get_current_user)):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
    try:
        obj_id = ObjectId(quiz_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid quiz ID")
        
    quiz = await main.db.quizzes.find_one({"_id": obj_id})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    questions = quiz.get("questions", [])
    total_questions = len(questions)
    correct_count = 0
    feedback = []
    
    for idx, q in enumerate(questions):
        user_ans = submission.answers[idx] if idx < len(submission.answers) else None
        is_correct = (user_ans == q["correct_option"])
        if is_correct:
            correct_count += 1
        feedback.append({
            "question_index": idx,
            "user_answer": user_ans,
            "correct_option": q["correct_option"],
            "is_correct": is_correct,
            "explanation": q.get("explanation")
        })
        
    score_percentage = round((correct_count / total_questions) * 100) if total_questions > 0 else 0
    
    if current_user.get("role") == "student":
        from datetime import datetime
        activity = {
            "student_username": current_user["username"],
            "quiz_id": quiz_id,
            "quiz_title": quiz.get("title"),
            "subject": quiz.get("subject"),
            "standard": quiz.get("standard"),
            "score_percentage": score_percentage,
            "correct_answers": correct_count,
            "total_questions": total_questions,
            "timestamp": datetime.utcnow()
        }
        await main.db.student_activity.insert_one(activity)
        
        # Gamification: Track perfect scores for 'Quiz Master' badge
        if score_percentage == 100:
            student = await main.db.students.find_one({"username": current_user["username"]})
            if student:
                perfect_count = student.get("perfect_quizzes", 0) + 1
                update_data = {"perfect_quizzes": perfect_count}
                
                # Award badge if reached 5 perfect quizzes
                badges = student.get("badges", [])
                if perfect_count >= 5 and "Quiz Master" not in badges:
                    badges.append("Quiz Master")
                    update_data["badges"] = badges
                    
                await main.db.students.update_one(
                    {"username": current_user["username"]},
                    {"$set": update_data}
                )
    return {
        "quiz_id": quiz_id,
        "total_questions": total_questions,
        "correct_answers": correct_count,
        "score_percentage": score_percentage,
        "feedback": feedback
    }
