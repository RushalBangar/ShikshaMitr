from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from bson.objectid import ObjectId
from datetime import datetime
from models import ForumPostModel, ForumReplyModel
from routes.auth import get_current_user
from security import rate_limiter
import main

router = APIRouter()

@router.get("/posts")
async def get_forum_posts(subject: Optional[str] = None):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    query = {}
    if subject:
        query["subject"] = subject
        
    posts = []
    cursor = main.db.forum_posts.find(query).sort("created_at", -1)
    async for document in cursor:
        doc_id = str(document["_id"])
        document["_id"] = doc_id
        document["id"] = doc_id
        
        # Get reply count
        reply_count = await main.db.forum_replies.count_documents({"post_id": doc_id})
        document["reply_count"] = reply_count
        posts.append(document)
        
    return posts

@router.post("/posts", dependencies=[Depends(rate_limiter(max_requests=3, window_seconds=60))])
async def create_forum_post(post: ForumPostModel, current_user: dict = Depends(get_current_user)):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    post_dict = post.dict()
    post_dict["author_username"] = current_user["username"]
    post_dict["author_role"] = current_user.get("role", "student")
    post_dict["created_at"] = datetime.utcnow()
    
    result = await main.db.forum_posts.insert_one(post_dict)
    
    created_post = await main.db.forum_posts.find_one({"_id": result.inserted_id})
    doc_id = str(created_post["_id"])
    created_post["_id"] = doc_id
    created_post["id"] = doc_id
    return created_post

@router.get("/posts/{post_id}/replies")
async def get_forum_replies(post_id: str):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    replies = []
    cursor = main.db.forum_replies.find({"post_id": post_id}).sort("created_at", 1)
    async for document in cursor:
        doc_id = str(document["_id"])
        document["_id"] = doc_id
        document["id"] = doc_id
        replies.append(document)
        
    return replies

@router.post("/posts/{post_id}/replies", dependencies=[Depends(rate_limiter(max_requests=5, window_seconds=60))])
async def create_forum_reply(post_id: str, reply: ForumReplyModel, current_user: dict = Depends(get_current_user)):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    # Check if post exists
    try:
        obj_id = ObjectId(post_id)
        post = await main.db.forum_posts.find_one({"_id": obj_id})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
        
    reply_dict = reply.dict()
    reply_dict["post_id"] = post_id
    reply_dict["author_username"] = current_user["username"]
    reply_dict["author_role"] = current_user.get("role", "student")
    reply_dict["created_at"] = datetime.utcnow()
    reply_dict["is_verified"] = False
    
    result = await main.db.forum_replies.insert_one(reply_dict)
    
    created_reply = await main.db.forum_replies.find_one({"_id": result.inserted_id})
    doc_id = str(created_reply["_id"])
    created_reply["_id"] = doc_id
    created_reply["id"] = doc_id
    return created_reply

@router.post("/posts/{post_id}/replies/{reply_id}/verify")
async def verify_forum_reply(post_id: str, reply_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can verify answers")
        
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    try:
        reply_obj_id = ObjectId(reply_id)
        reply = await main.db.forum_replies.find_one({"_id": reply_obj_id, "post_id": post_id})
        if not reply:
            raise HTTPException(status_code=404, detail="Reply not found")
    except:
        raise HTTPException(status_code=400, detail="Invalid reply ID")
        
    # Verify the reply
    await main.db.forum_replies.update_one({"_id": reply_obj_id}, {"$set": {"is_verified": True}})
    
    # Award Community Points to the reply author if it's a student
    author_username = reply.get("author_username")
    author_role = reply.get("author_role")
    
    if author_role == "student" and author_username:
        await main.db.students.update_one(
            {"username": author_username},
            {"$inc": {"community_points": 10}}
        )
        
    return {"message": "Reply verified and points awarded"}
