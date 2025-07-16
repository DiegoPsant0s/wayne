from enum import Enum
from pydantic import BaseModel

class UserRole(str, Enum):
    ADMIN = "admin"
    GERENTE = "gerente"
    EMPREGADO = "empregado"
    USER = "user"  # Opcional

class User(BaseModel):
    username: str
    password: str
    role: UserRole

class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRole