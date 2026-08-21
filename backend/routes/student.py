from fastapi import APIRouter, HTTPException, Depends
from routes.auth import get_current_user
from datetime import datetime, timedelta
import main

router = APIRouter()

@router.get("/student/stats")
async def get_student_stats(current_user: dict = Depends(get_current_user)):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only students can view stats")
        
    username = current_user.get("username")
    
    # Get all activities sorted by date descending
    cursor = main.db.student_activity.find({"student_username": username}).sort("timestamp", -1)
    activities = []
    async for doc in cursor:
        activities.append(doc)
        
    total_quizzes = len(activities)
    
    if total_quizzes > 0:
        avg_score = sum(a.get("score_percentage", 0) for a in activities) / total_quizzes
    else:
        avg_score = 0
        
    # Calculate streak (consecutive days played)
    streak = 0
    if total_quizzes > 0:
        unique_dates = []
        for a in activities:
            date_str = a["timestamp"].date().isoformat()
            if date_str not in unique_dates:
                unique_dates.append(date_str)
                
        # unique_dates is sorted from newest to oldest
        current_date = datetime.utcnow().date()
        
        # If they played today or yesterday, they have an active streak
        if unique_dates:
            first_date = datetime.fromisoformat(unique_dates[0]).date()
            if (current_date - first_date).days <= 1:
                streak = 1
                for i in range(1, len(unique_dates)):
                    prev_date = datetime.fromisoformat(unique_dates[i-1]).date()
                    curr_date = datetime.fromisoformat(unique_dates[i]).date()
                    if (prev_date - curr_date).days == 1:
                        streak += 1
                    else:
                        break
    
    return {
        "username": username,
        "total_quizzes": total_quizzes,
        "average_score": round(avg_score),
        "streak": streak,
        "recent_activities": [{
            "quiz_title": a.get("quiz_title"),
            "score": a.get("score_percentage"),
            "date": a.get("timestamp").isoformat()
        } for a in activities[:5]]
    }
