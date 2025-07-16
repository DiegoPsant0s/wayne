from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from auth import authenticate_user, create_access_token
from .security import get_current_user, check_permission
from models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        return {"error": "Invalid credentials"}
    token = create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user