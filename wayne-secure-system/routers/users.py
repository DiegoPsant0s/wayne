
from fastapi import APIRouter, Depends
from typing import List
from models.user import User, UserRole
from pydantic import BaseModel
from .security import get_current_user, check_permission
from utils.responses import success_response, error_response

router = APIRouter(prefix="/users", tags=["Users"])

class UserOut(BaseModel):
    username: str
    role: str

class UserEdit(BaseModel):
    username: str
    role: str

class UserDelete(BaseModel):
    username: str

class UserPasswordChange(BaseModel):
    username: str
    new_password: str

class UserCreate(BaseModel):
    username: str
    password: str
    role: str

@router.put("/change-password", response_model=dict)
def change_password(data: UserPasswordChange, current_user: User = Depends(get_current_user)):
    check_permission(current_user, allowed_roles=["admin", "ADMIN", "GERENTE"])
    from database_manager import db_manager
    user_data = db_manager.get_user(data.username)
    if not user_data:
        return error_response(message="Usuário não encontrado", status_code=404)
    import sqlite3
    conn = sqlite3.connect(db_manager.db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password_hash = ? WHERE username = ?", (data.new_password, data.username))
    conn.commit()
    conn.close()
    return success_response(message="Senha alterada com sucesso")

@router.post("/create", response_model=UserOut)
def create_user(user_create: UserCreate, current_user: User = Depends(get_current_user)):
    check_permission(current_user, allowed_roles=["admin", "ADMIN", "GERENTE"])
    from database_manager import db_manager
    if db_manager.get_user(user_create.username):
        return error_response(message="Usuário já existe", status_code=400)
    import sqlite3
    conn = sqlite3.connect(db_manager.db_path)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, ?, 1)",
        (user_create.username, user_create.password, user_create.role)
    )
    conn.commit()
    conn.close()
    return success_response(data=UserOut(username=user_create.username, role=user_create.role))
from fastapi import APIRouter, Depends
from typing import List
from models.user import User, UserRole
from pydantic import BaseModel
from .security import get_current_user, check_permission
from utils.responses import success_response, error_response



router = APIRouter(prefix="/users", tags=["Users"])

class UserOut(BaseModel):
    username: str
    role: str

@router.put("/edit", response_model=UserOut)
def edit_user(user_edit: UserEdit, current_user: User = Depends(get_current_user)):
    check_permission(current_user, allowed_roles=["admin", "ADMIN"])
    from database_manager import db_manager
    user_data = db_manager.get_user(user_edit.username)
    if not user_data:
        return error_response(message="Usuário não encontrado", status_code=404)
    import sqlite3
    conn = sqlite3.connect(db_manager.db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET role = ? WHERE username = ?", (user_edit.role, user_edit.username))
    conn.commit()
    conn.close()
    return UserOut(username=user_edit.username, role=user_edit.role)

@router.delete("/delete", response_model=dict)
def delete_user(user_delete: UserDelete, current_user: User = Depends(get_current_user)):
    check_permission(current_user, allowed_roles=["admin", "ADMIN"])
    from database_manager import db_manager
    user_data = db_manager.get_user(user_delete.username)
    if not user_data:
        return error_response(message="Usuário não encontrado", status_code=404)
    import sqlite3
    conn = sqlite3.connect(db_manager.db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET is_active = 0 WHERE username = ?", (user_delete.username,))
    conn.commit()
    conn.close()
    return {"message": "Usuário excluído com sucesso"}



class UserOut(BaseModel):
    username: str
    role: UserRole

class UserEdit(BaseModel):
    username: str
    role: str

class UserDelete(BaseModel):
    username: str


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=List[UserOut])
def list_users(current_user: User = Depends(get_current_user)):
    from database_manager import db_manager
    # ADMIN/GERENTE vê todos, outros só o próprio
    if hasattr(current_user.role, 'value'):
        role_str = str(current_user.role.value).lower()
    else:
        role_str = str(current_user.role).lower() if current_user.role else ""
    if role_str in ["admin", "gerente"]:
        users_data = []
        import sqlite3
        conn = sqlite3.connect(db_manager.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT username, role FROM users WHERE is_active = 1")
        rows = cursor.fetchall()
        for row in rows:
            users_data.append(UserOut(username=row[0], role=row[1]))
        conn.close()
        return users_data
    else:
        # Retorna apenas o próprio perfil
        user = db_manager.get_user(current_user.username)
        if user:
            return [UserOut(username=user["username"], role=user["role"])]
        else:
            return []

@router.put("/edit", response_model=UserOut)
def edit_user(user_edit: UserEdit, current_user: User = Depends(get_current_user)):
    check_permission(current_user, allowed_roles=["admin", "ADMIN"])
    from database_manager import db_manager
    user_data = db_manager.get_user(user_edit.username)
    if not user_data:
        return error_response(message="Usuário não encontrado", status_code=404)
    import sqlite3
    conn = sqlite3.connect(db_manager.db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET role = ? WHERE username = ?", (user_edit.role, user_edit.username))
    conn.commit()
    conn.close()
    return success_response(data=UserOut(username=user_edit.username, role=user_edit.role))

@router.delete("/delete", response_model=dict)
def delete_user(user_delete: UserDelete, current_user: User = Depends(get_current_user)):
    check_permission(current_user, allowed_roles=["admin", "ADMIN"])
    from database_manager import db_manager
    user_data = db_manager.get_user(user_delete.username)
    if not user_data:
        return error_response(message="Usuário não encontrado", status_code=404)
    import sqlite3
    conn = sqlite3.connect(db_manager.db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET is_active = 0 WHERE username = ?", (user_delete.username,))
    conn.commit()
    conn.close()
    return success_response(message="Usuário excluído com sucesso")