from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models import MaterialModel
from routes.auth import get_current_user
import main # Import main to access db connection

router = APIRouter()

@router.get("/materials", response_model=List[MaterialModel])
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
        document["_id"] = str(document["_id"])
        materials.append(MaterialModel(**document))
        
    return materials

@router.post("/materials", response_model=MaterialModel)
async def create_material(material: MaterialModel, current_user: dict = Depends(get_current_user)):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    material_dict = material.dict(by_alias=True, exclude={"id"})
    result = await main.db.materials.insert_one(material_dict)
    
    created_material = await main.db.materials.find_one({"_id": result.inserted_id})
    created_material["_id"] = str(created_material["_id"])
    return MaterialModel(**created_material)
