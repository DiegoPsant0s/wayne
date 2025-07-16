
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from schemas.user import LoginRequest, TokenResponse
from auth import authenticate_user, create_access_token, hash_password, get_current_user, logout_user
from models.user import User, UserRole
from database_manager import db_manager
from security_manager import data_validator
import logging
from utils.responses import success_response, error_response

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/register")
def register(user_data: LoginRequest):
    existing_user = db_manager.get_user(user_data.username)
    if existing_user:
        return error_response(message="Usuário já existe", status_code=400)
    password_strength = data_validator.validate_password_strength(user_data.password)
    if not password_strength["is_strong"]:
        return error_response(message="Senha muito fraca. Deve conter maiúscula, minúscula, número e caractere especial.", status_code=400)
    password_hash = hash_password(user_data.password)
    user_id = db_manager.add_user(user_data.username, password_hash, "user")
    if user_id:
        logging.info(f"Usuário {user_data.username} cadastrado com sucesso.")
        return success_response(message="Usuário cadastrado com sucesso", data={"user_id": user_id})
    else:
        return error_response(message="Erro ao criar usuário", status_code=500)

@router.post("/login", response_model=TokenResponse)
def login_oauth2(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        logging.warning(f"Tentativa de login falhou para usuário: {form_data.username}")
        return error_response(message="Usuário ou senha inválidos", status_code=401)
    access_token = create_access_token(data={"username": user.username})
    logging.info(f"Login bem-sucedido para usuário: {user.username}")
    return success_response(data={"access_token": access_token, "token_type": "bearer", "role": user.role.value}, message="Login realizado com sucesso")

@router.post("/logout")
def logout(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    success = logout_user(token)
    if success:
        db_manager.log_audit(
            username=user.username,
            action="LOGOUT",
            details="Usuário fez logout com sucesso"
        )
        return success_response(message="Logout realizado com sucesso")
    else:
        return error_response(message="Erro ao fazer logout", status_code=400)

@router.get("/validate")
def validate_token(current_user: User = Depends(get_current_user)):
    return success_response(data={
        "valid": True,
        "username": current_user.username,
        "role": current_user.role.value
    }, message="Token válido")