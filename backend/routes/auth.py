import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import bcrypt
from pydantic import BaseModel
from typing import Optional
import main
import os

router = APIRouter()

# Security Config
SECRET_KEY = os.environ.get("JWT_SECRET", "super-secret-key-shikshamitr")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class Token(BaseModel):
    access_token: str
    token_type: str

def verify_password(plain_password, hashed_password):
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password, hashed_password)

def get_password_hash(password):
    if isinstance(password, str):
        password = password.encode('utf-8')
    return bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Dependency for protecting routes
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role", "faculty") # Default to faculty for older tokens
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    if role == "student":
        user = await main.db.students.find_one({"username": username})
    else:
        user = await main.db.staff.find_one({
            "$or": [
                {"username": username},
                {"email": username.lower()}
            ]
        })
        
    if user is None:
        raise credentials_exception
    
    # Attach role to user object for route handlers
    user["role"] = role
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    identifier = form_data.username.strip()
    
    # 1. Check Faculty/Staff
    user = await main.db.staff.find_one({
        "$or": [
            {"username": identifier},
            {"email": identifier.lower()}
        ]
    })
    role = "faculty"
    
    # 2. Check Students if not staff
    if not user:
        user = await main.db.students.find_one({"username": identifier})
        role = "student"
        
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

class StudentRegister(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: str

@router.post("/student-register")
async def register_student(data: StudentRegister):
    if not main.db_connected:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    # Check if username exists
    existing_student = await main.db.students.find_one({"username": data.username})
    if existing_student:
        raise HTTPException(status_code=400, detail="Username already taken")
        
    existing_staff = await main.db.staff.find_one({"username": data.username})
    if existing_staff:
        raise HTTPException(status_code=400, detail="Username reserved")
        
    student_doc = {
        "username": data.username,
        "full_name": data.full_name,
        "email": data.email,
        "password_hash": get_password_hash(data.password),
        "created_at": datetime.utcnow()
    }
    
    await main.db.students.insert_one(student_doc)
    return {"message": "Student registered successfully"}
