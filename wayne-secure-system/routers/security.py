from fastapi import Depends, HTTPException, status
from models.user import User
from typing import List
from fastapi.security import OAuth2PasswordBearer
from auth import decode_access_token
from database_manager import get_user_by_username

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
  
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = get_user_by_username(username)
    if not user:
        raise credentials_exception
    return user

def check_permission(user: User, allowed_roles: List[str]):
   
    # Padroniza para aceitar roles em qualquer formato (maiusc/minusc)
    user_role = str(user.role.value).lower()
    allowed_roles_lower = [r.lower() for r in allowed_roles]
    if user_role not in allowed_roles_lower:
        import logging
        logging.warning(f"Usuário {user.username} ({user.role.value}) tentou acessar recurso sem permissão.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada"
        )