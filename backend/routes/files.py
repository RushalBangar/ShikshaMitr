from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from routes.auth import get_current_user
import main
import io

router = APIRouter()

# ── MongoDB GridFS-based file storage ──────────────────────────────
# No external service needed — files are stored in the same MongoDB
# Atlas database that the rest of the app already uses.

async def _get_gridfs():
    """Return a motor GridFS bucket for the current database."""
    from motor.motor_asyncio import AsyncIOMotorGridFSBucket
    if not main.db:
        raise HTTPException(status_code=503, detail="Database not connected")
    return AsyncIOMotorGridFSBucket(main.db)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can perform this action")
    if not (file.filename and file.filename.lower().endswith(".pdf")) or file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    try:
        bucket = await _get_gridfs()

        # Read file contents
        contents = await file.read()

        # Store in GridFS with metadata
        file_id = await bucket.upload_from_stream(
            file.filename,
            io.BytesIO(contents),
            metadata={
                "content_type": "application/pdf",
                "uploaded_by": current_user["username"],
            },
        )

        # The download URL is served by our own /download endpoint below
        download_url = f"/api/files/download/{file_id}"

        return {
            "filename": file.filename,
            "file_id": str(file_id),
            "url": download_url,
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@router.get("/download/{file_id}")
async def download_file(file_id: str):
    """Stream a file back from GridFS."""
    from bson import ObjectId

    try:
        oid = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid file ID")

    bucket = await _get_gridfs()

    # Check the file exists
    file_doc = await main.db["fs.files"].find_one({"_id": oid})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")

    # Stream the file from GridFS
    grid_out = await bucket.open_download_stream(oid)
    contents = await grid_out.read()

    content_type = (file_doc.get("metadata") or {}).get("content_type", "application/octet-stream")

    return StreamingResponse(
        io.BytesIO(contents),
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="{file_doc["filename"]}"',
        },
    )
