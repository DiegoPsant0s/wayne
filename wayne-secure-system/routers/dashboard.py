
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from auth import get_current_user, check_permission
from schemas.dashboard import DashboardResponse
from database_manager import db_manager
from models.user import User
import logging
from mock_alerts import get_alerts as get_alerts_func, edit_alert, delete_alert
from utils.responses import success_response, error_response

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


@router.get("", response_model=DashboardResponse)
@router.get("/", response_model=DashboardResponse)
def get_dashboard(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    logging.info(f"Usuário {user.username} ({user.role.value}) acessou o dashboard.")
    stats = db_manager.get_dashboard_stats()
    return success_response(data={
        "user": user.username,
        "role": user.role.value,
        "dashboard_stats": stats
    })

@router.get("/alerts")
def get_alerts(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    check_permission(user, ["admin", "gerente", "analista"])
    logging.info(f"Usuário {user.username} ({user.role.value}) acessou os alertas.")
    return success_response(data=get_alerts_func())

@router.put("/alerts/{alert_id}")
def dashboard_edit_alert(alert_id: int, alert_update: dict, token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    check_permission(user, ["admin", "gerente", "analista"])
    alert = edit_alert(alert_id, alert_update)
    if alert:
        return success_response(data=alert, message="Alerta editado com sucesso")
    return error_response(message="Alerta não encontrado", status_code=404)

@router.delete("/alerts/{alert_id}")
def dashboard_delete_alert(alert_id: int, token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    check_permission(user, ["admin", "gerente", "analista"])
    if delete_alert(alert_id):
        return success_response(message="Alerta removido com sucesso")
    return error_response(message="Alerta não encontrado", status_code=404)

@router.get("/summary", summary="Resumo do dashboard")
def dashboard_summary(token: str = Depends(oauth2_scheme)):
    stats = db_manager.get_dashboard_stats()
    return success_response(data=stats)