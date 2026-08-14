from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models import MaterialModel, MaterialUpdateModel
from routes.auth import get_current_user
from bson.objectid import ObjectId
import main # Import main to access db connection

router = APIRouter()

@router.get("/materials")
async def get_materials(type: Optional[str] = None, standard: Optional[int] = None, subject: Optional[str] = None):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    query = {}
    if type:
        query["type"] = type
    if standard:
        query["standard"] = standard
    if subject:
        query["subject"] = subject
        
    materials = []
    cursor = main.db.materials.find(query)
    async for document in cursor:
        doc_id = str(document["_id"])
        document["_id"] = doc_id
        document["id"] = doc_id
        materials.append(document)
        
    return materials

from routes.ws import manager

@router.post("/materials")
async def create_material(material: MaterialModel, current_user: dict = Depends(get_current_user)):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    material_dict = material.dict(by_alias=True, exclude={"id"})
    result = await main.db.materials.insert_one(material_dict)
    
    created_material = await main.db.materials.find_one({"_id": result.inserted_id})
    doc_id = str(created_material["_id"])
    created_material["_id"] = doc_id
    created_material["id"] = doc_id
    
    # Broadcast real-time notification
    mat_type_label = material.type.replace('_', ' ').title()
    await manager.broadcast({
        "type": "NEW_MATERIAL",
        "title": material.title,
        "subject": material.subject,
        "standard": material.standard,
        "message": f"📚 New {material.subject} {mat_type_label} uploaded for Class {material.standard}: {material.title}"
    })
    
    return created_material

@router.delete("/materials/{material_id}")
async def delete_material(material_id: str, current_user: dict = Depends(get_current_user)):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
    try:
        obj_id = ObjectId(material_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid material ID format")
        
    result = await main.db.materials.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
        
    return {"message": "Material deleted successfully"}

@router.put("/materials/{material_id}")
async def update_material(material_id: str, update_data: MaterialUpdateModel, current_user: dict = Depends(get_current_user)):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
    try:
        obj_id = ObjectId(material_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid material ID format")
        
    result = await main.db.materials.update_one(
        {"_id": obj_id},
        {"$set": {"title": update_data.title}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
        
    return {"message": "Material updated successfully"}
