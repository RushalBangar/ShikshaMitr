from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from routes.auth import get_current_user
import main

router = APIRouter()

import cloudinary
import cloudinary.uploader
import os

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can perform this action")
    if not (file.filename and file.filename.lower().endswith(".pdf")) or file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
        
    try:
        # Check if CLOUDINARY_URL is set, OR if separate variables are set
        cloudinary_url = os.getenv("CLOUDINARY_URL")
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
        api_key = os.getenv("CLOUDINARY_API_KEY")
        api_secret = os.getenv("CLOUDINARY_API_SECRET")
        
        if not cloudinary_url and not (cloud_name and api_key and api_secret):
            raise HTTPException(status_code=500, detail="Cloudinary is not configured on the server.")
            
        if cloud_name and api_key and api_secret:
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret
            )
            
        # We can pass the file-like object directly to Cloudinary
        # resource_type="raw" is needed for PDFs and non-image files.
        upload_result = cloudinary.uploader.upload(
            file.file, 
            resource_type="raw", 
            public_id=file.filename.split('.')[0] + "_" + current_user["username"]
        )
        
        secure_url = upload_result.get("secure_url")
        
        # Return the URL that can be used to download the file
        return {
            "filename": file.filename,
            "file_id": upload_result.get("public_id"), # For legacy sake or reference
            "url": secure_url
        }
    except Exception as e:
        import traceback
        traceback.print_exc() # Log the full error to Render console
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
