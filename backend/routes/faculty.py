from fastapi import APIRouter, HTTPException, Depends
from routes.auth import get_current_user
from datetime import datetime, timedelta
import main

router = APIRouter()

@router.get("/analytics")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can view analytics")
        
    # Get all activities
    cursor = main.db.student_activity.find({})
    activities = []
    async for doc in cursor:
        activities.append(doc)
        
    total_quizzes_taken = len(activities)
    
    if total_quizzes_taken > 0:
        avg_score = sum(a.get("score_percentage", 0) for a in activities) / total_quizzes_taken
    else:
        avg_score = 0
        
    # Group by subject
    subject_stats = {}
    for a in activities:
        subj = a.get("subject", "Unknown")
        if subj not in subject_stats:
            subject_stats[subj] = {"count": 0, "total_score": 0}
        subject_stats[subj]["count"] += 1
        subject_stats[subj]["total_score"] += a.get("score_percentage", 0)
        
    subject_breakdown = []
    for subj, data in subject_stats.items():
        subject_breakdown.append({
            "subject": subj,
            "count": data["count"],
            "avg_score": round(data["total_score"] / data["count"]) if data["count"] > 0 else 0
        })
        
    # Group by date (last 7 days)
    last_7_days = [(datetime.utcnow() - timedelta(days=i)).date().isoformat() for i in range(6, -1, -1)]
    date_counts = {date: 0 for date in last_7_days}
    
    for a in activities:
        date_str = a["timestamp"].date().isoformat()
        if date_str in date_counts:
            date_counts[date_str] += 1
            
    trend_data = {
        "labels": last_7_days,
        "counts": [date_counts[date] for date in last_7_days]
    }
    
    return {
        "total_quizzes_taken": total_quizzes_taken,
        "average_score": round(avg_score),
        "subject_breakdown": subject_breakdown,
        "trend_data": trend_data
    }
