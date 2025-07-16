from pydantic import BaseModel
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    GERENTE = "gerente"
    EMPREGADO = "empregado"
    USER = "user"

class UserOut(BaseModel):
    username: str
    role: UserRole

class User(BaseModel):
    username: str
    password: str
    role: UserRole


class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str

class UserOut(BaseModel):
    username: str
    role: UserRole