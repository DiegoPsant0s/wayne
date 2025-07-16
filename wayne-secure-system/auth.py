import os
from dotenv import load_dotenv
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from models.user import User, UserRole
from fastapi import HTTPException, status
from database_manager import db_manager
from security_manager import security_manager

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

if not SECRET_KEY:
    raise Exception("SECRET_KEY não definido! Verifique seu arquivo .env")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "sub": data.get("username")})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    security_manager.create_session(data.get("username"), token, expire)
    
    return token

def decode_access_token(token: str):
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise credentials_exception

def init_default_users():
    default_users = [
        ("wayne", "bat123", "admin"),
        ("lucius", "fox123", "gerente"),
        ("dick", "night", "empregado"),
        ("alfred", "pennyworth", "empregado"),
        ("admin", "admin123", "admin"),
    ]
    
    for username, password, role in default_users:
        existing_user = db_manager.get_user(username)
        if not existing_user:
            password_hash = hash_password(password)
            db_manager.add_user(username, password_hash, role)
            print(f"Usuário {username} criado com sucesso.")

init_default_users()

def authenticate_user(username: str, password: str):
    user_data = db_manager.get_user(username)
    if user_data and verify_password(password, user_data["password_hash"]):
        db_manager.update_last_login(username)
        
        user = User(
            username=user_data["username"],
            password=user_data["password_hash"],
            role=UserRole(user_data["role"])
        )
        
        security_manager.log_security_event(
            username=username,
            event_type="SUCCESSFUL_LOGIN",
            details=f"Login bem-sucedido para usuário {username}"
        )
        
        return user
    
    security_manager.log_security_event(
        username=username,
        event_type="FAILED_LOGIN",
        details=f"Tentativa de login falhou para usuário {username}"
    )
    
    return None

def get_current_user(token: str):
    import logging
    logger = logging.getLogger("wayne.auth")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            logger.warning(f"Token sem campo 'sub'. Token: {token}")
            raise credentials_exception
        if not security_manager.validate_session(token):
            logger.warning(f"Sessão inválida para token: {token}")
            raise credentials_exception
        # Busca usuário no banco de dados
        user_data = db_manager.get_user(username)
        if user_data is None:
            logger.warning(f"Usuário '{username}' não encontrado no banco. Token: {token}")
            raise credentials_exception
        # Cria objeto User
        user = User(
            username=user_data["username"],
            password=user_data["password_hash"],
            role=UserRole(user_data["role"])
        )
        return user
    except JWTError as e:
        logger.error(f"JWTError ao decodificar token: {token}. Erro: {e}")
        raise credentials_exception

def check_permission(user, allowed_roles):
    if user.role.value not in allowed_roles and user.role.name not in allowed_roles:
        security_manager.log_security_event(
            username=user.username,
            event_type="UNAUTHORIZED_ACCESS",
            details=f"Tentativa de acesso não autorizada por '{user.username}'"
        )
        
        db_manager.add_alert(
            "ACESSO_NEGADO",
            f"Tentativa de acesso não autorizada por '{user.username}'.",
            "ALTO"
        )
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada"
        )


def logout_user(token: str) -> bool:
    return security_manager.invalidate_session(token)

from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def require_roles(allowed_roles):
    def decorator(endpoint_func):
        async def wrapper(request: Request, token: str = Depends(oauth2_scheme), *args, **kwargs):
            user = get_current_user(token)
            check_permission(user, allowed_roles)
            return await endpoint_func(request, user=user, *args, **kwargs)
        return wrapper
    return decorator