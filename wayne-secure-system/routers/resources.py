from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from schemas.resource import ResourceIn, ResourceOut
from auth import get_current_user, check_permission
from database_manager import db_manager
from mock_alerts import add_alert
import logging
from utils.responses import success_response, error_response

router = APIRouter(prefix="/resources", tags=["Resources"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@router.get("/", response_model=list[ResourceOut])
def list_resources(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    resources = db_manager.get_resources()
    return success_response(data=resources)

@router.post("/", response_model=ResourceOut)
def add_resource(resource: ResourceIn, token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    check_permission(user, ["admin", "gerente"])
    resource_data = resource.model_dump()
    new_id = db_manager.add_resource(
        name=resource_data["name"],
        type=resource_data["type"],
        description=resource_data["description"],
        status=resource_data["status"],
        created_by=user.username
    )
    add_alert(
        "RECURSO_ADICIONADO",
        f"Recurso '{resource_data.get('name', 'ID ' + str(new_id))}' adicionado por '{user.username}'.",
        "MÉDIO"
    )
    resource_data["id"] = new_id
    return success_response(data=ResourceOut(**resource_data).model_dump(), message="Recurso adicionado com sucesso")

@router.put("/{idx}", response_model=ResourceOut)
def edit_resource(idx: int, resource: ResourceIn, token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    check_permission(user, ["admin", "gerente"])
    resource_data = resource.model_dump()
    updated = db_manager.update_resource(
        resource_id=idx,
        name=resource_data["name"],
        type=resource_data["type"],
        description=resource_data["description"],
        status=resource_data["status"]
    )
    if not updated:
        return error_response(message="Recurso não encontrado", status_code=404)
    add_alert(
        "RECURSO_EDITADO",
        f"Recurso '{resource_data.get('name', 'ID ' + str(idx))}' editado por '{user.username}'.",
        "MÉDIO"
    )
    resource_data["id"] = idx
    return success_response(data=ResourceOut(**resource_data), message="Recurso editado com sucesso")

@router.delete("/{idx}")
def remove_resource(idx: int, token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    check_permission(user, ["admin", "gerente"])
    removed = db_manager.delete_resource(idx)
    if not removed:
        return error_response(message="Recurso não encontrado", status_code=404)
    add_alert(
        "RECURSO_REMOVIDO",
        f"Recurso ID {idx} removido por '{user.username}'.",
        "MÉDIO"
    )
    return success_response(message="Recurso removido com sucesso")