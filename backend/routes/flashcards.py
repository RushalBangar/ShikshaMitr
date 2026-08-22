from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from models import FlashcardDeckModel, FlashcardReviewModel
from routes.auth import get_current_user
import main

router = APIRouter()

@router.get("/decks")
async def get_flashcard_decks(subject: Optional[str] = None):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    query = {}
    if subject:
        query["subject"] = subject
        
    decks = []
    cursor = main.db.flashcard_decks.find(query)
    async for document in cursor:
        doc_id = str(document["_id"])
        document["_id"] = doc_id
        document["id"] = doc_id
        decks.append(document)
        
    return decks

@router.post("/decks")
async def create_flashcard_deck(deck: FlashcardDeckModel, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can perform this action")
        
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    deck_dict = deck.dict()
    deck_dict["author_username"] = current_user["username"]
    
    # Assign unique IDs to cards within the deck for review tracking
    for idx, card in enumerate(deck_dict.get("cards", [])):
        card["card_id"] = str(ObjectId())
        
    result = await main.db.flashcard_decks.insert_one(deck_dict)
    
    created_deck = await main.db.flashcard_decks.find_one({"_id": result.inserted_id})
    doc_id = str(created_deck["_id"])
    created_deck["_id"] = doc_id
    created_deck["id"] = doc_id
    return created_deck

@router.get("/decks/{deck_id}/study")
async def study_flashcards(deck_id: str, current_user: dict = Depends(get_current_user)):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    try:
        obj_id = ObjectId(deck_id)
        deck = await main.db.flashcard_decks.find_one({"_id": obj_id})
        if not deck:
            raise HTTPException(status_code=404, detail="Deck not found")
    except:
        raise HTTPException(status_code=400, detail="Invalid deck ID")
        
    cards = deck.get("cards", [])
    due_cards = []
    now = datetime.utcnow()
    
    for card in cards:
        card_id = card.get("card_id")
        review_log = await main.db.flashcard_reviews.find_one({
            "student_username": current_user["username"],
            "deck_id": deck_id,
            "card_id": card_id
        })
        
        # If never reviewed or due date has passed
        if not review_log or review_log.get("next_review_date") <= now:
            due_cards.append(card)
            
    return {"deck_id": deck_id, "title": deck.get("title"), "due_cards": due_cards}

@router.post("/decks/{deck_id}/review/{card_id}")
async def review_flashcard(deck_id: str, card_id: str, review: FlashcardReviewModel, current_user: dict = Depends(get_current_user)):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    rating = review.rating
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
    review_log = await main.db.flashcard_reviews.find_one({
        "student_username": current_user["username"],
        "deck_id": deck_id,
        "card_id": card_id
    })
    
    # Simple SRS Algorithm based on SuperMemo-2
    if not review_log:
        interval = 1
        ease_factor = 2.5
    else:
        interval = review_log.get("interval", 1)
        ease_factor = review_log.get("ease_factor", 2.5)
        
    if rating >= 3:
        if interval == 0:
            interval = 1
        elif interval == 1:
            interval = 6
        else:
            interval = round(interval * ease_factor)
            
        ease_factor = ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
    else:
        interval = 1
        
    if ease_factor < 1.3:
        ease_factor = 1.3
        
    next_review_date = datetime.utcnow() + timedelta(days=interval)
    
    await main.db.flashcard_reviews.update_one(
        {
            "student_username": current_user["username"],
            "deck_id": deck_id,
            "card_id": card_id
        },
        {"$set": {
            "interval": interval,
            "ease_factor": ease_factor,
            "next_review_date": next_review_date,
            "last_review_date": datetime.utcnow()
        }},
        upsert=True
    )
    
    return {"message": "Review recorded", "next_review_date": next_review_date}
