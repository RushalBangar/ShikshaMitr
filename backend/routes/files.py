from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import StreamingResponse
from routes.auth import get_current_user
import main
import os
import re

# ── CRITICAL: Neutralize CLOUDINARY_URL before importing cloudinary ──
# The cloudinary library auto-parses CLOUDINARY_URL on import.
# If the value is malformed in any way, the entire app crashes.
# We extract what we need manually, then REMOVE it from the environment
# so the library import is always clean.
_cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
_api_key    = os.getenv("CLOUDINARY_API_KEY")
_api_secret = os.getenv("CLOUDINARY_API_SECRET")

if not (_cloud_name and _api_key and _api_secret):
    _raw_url = os.getenv("CLOUDINARY_URL", "")
    if _raw_url.startswith("CLOUDINARY_URL="):
        _raw_url = _raw_url[len("CLOUDINARY_URL="):]
    _m = re.match(r"cloudinary://([^:]+):([^@]+)@(.+)", _raw_url)
    if _m:
        _api_key, _api_secret, _cloud_name = _m.groups()

# Remove CLOUDINARY_URL so the library won't try to auto-parse it
os.environ.pop("CLOUDINARY_URL", None)

import cloudinary
import cloudinary.uploader

router = APIRouter()

if _cloud_name and _api_key and _api_secret:
    cloudinary.config(
        cloud_name=_cloud_name,
        api_key=_api_key,
        api_secret=_api_secret,
    )
    print(f"[Cloudinary] Configured for cloud '{_cloud_name}' with key {_api_key[:6]}...")
else:
    print("[Cloudinary] WARNING: credentials not found – uploads will fail")
    print(f"[Cloudinary] DEBUG: CLOUD_NAME={_cloud_name}, API_KEY={_api_key}, SECRET={'set' if _api_secret else 'None'}")


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "faculty":
        raise HTTPException(status_code=403, detail="Only faculty can perform this action")
    if not (file.filename and file.filename.lower().endswith(".pdf")) or file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    # Quick guard – if config was never loaded, fail fast with a clear message
    cfg = cloudinary.config()
    if not cfg.api_key:
        raise HTTPException(status_code=500, detail="Cloudinary is not configured on the server.")

    try:
        upload_result = cloudinary.uploader.upload(
            file.file,
            resource_type="raw",
            public_id=file.filename.split(".")[0] + "_" + current_user["username"],
        )

        return {
            "filename": file.filename,
            "file_id": upload_result.get("public_id"),
            "url": upload_result.get("secure_url"),
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
