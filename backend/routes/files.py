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

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user),
    fs: AsyncIOMotorGridFSBucket = Depends(get_gridfs)
):
    if not (file.filename and file.filename.lower().endswith(".pdf")) or file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
        
    try:
        # Open GridFS upload stream
        grid_in = fs.open_upload_stream(
            file.filename,
            metadata={"content_type": file.content_type, "uploaded_by": current_user["username"]}
        )
        
        # Read file in 1MB chunks and write to GridFS to prevent memory exhaustion
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            await grid_in.write(chunk)
            
        await grid_in.close()
        file_id = grid_in._id
        
        # Return the URL that can be used to download the file
        return {
            "filename": file.filename,
            "file_id": str(file_id),
            "url": f"/api/files/{str(file_id)}"
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
