from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from routes.auth import get_current_user
import main
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
import io

router = APIRouter()

# Dependency to get GridFS bucket
async def get_gridfs():
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
    return AsyncIOMotorGridFSBucket(main.db)

import cloudinary
import cloudinary.uploader
import os

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user),
    fs: AsyncIOMotorGridFSBucket = Depends(get_gridfs)
):
    if not (file.filename and file.filename.lower().endswith(".pdf")) or file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
        
    try:
        # Check if CLOUDINARY_URL is set
        if not os.getenv("CLOUDINARY_URL"):
            raise HTTPException(status_code=500, detail="Cloudinary is not configured on the server.")
            
        # We need to read the file into memory and upload.
        # For large files, we might need a custom chunked stream, but Cloudinary's upload accepts a file-like object or bytes.
        file_bytes = await file.read()
        
        # Upload to Cloudinary using the bytes
        # resource_type="raw" is needed for PDFs and non-image files, though "auto" or "image" works for pdfs if we want to generate thumbnails.
        # Let's use "auto"
        upload_result = cloudinary.uploader.upload(
            file_bytes, 
            resource_type="raw", 
            public_id=file.filename.split('.')[0] + "_" + current_user["username"],
            format="pdf"
        )
        
        secure_url = upload_result.get("secure_url")
        
        # Return the URL that can be used to download the file
        return {
            "filename": file.filename,
            "file_id": upload_result.get("public_id"), # For legacy sake or reference
            "url": secure_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.get("/{file_id}")
async def get_file(file_id: str, fs: AsyncIOMotorGridFSBucket = Depends(get_gridfs)):
    try:
        from bson.objectid import ObjectId
        
        try:
            obj_id = ObjectId(file_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid file ID format")
            
        # Check if file exists
        grid_out = await fs.open_download_stream(obj_id)
        
        if not grid_out:
            raise HTTPException(status_code=404, detail="File not found")
            
        # Get metadata
        content_type = "application/octet-stream"
        if grid_out.metadata and "content_type" in grid_out.metadata:
            content_type = grid_out.metadata["content_type"]
            
        # Create a streaming response
        async def file_stream():
            while True:
                chunk = await grid_out.readchunk()
                if not chunk:
                    break
                yield chunk
                
        return StreamingResponse(
            file_stream(),
            media_type=content_type,
            headers={"Content-Disposition": f'inline; filename="{grid_out.filename}"'}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve file: {str(e)}")
