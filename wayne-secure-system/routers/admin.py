from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from auth import get_current_user, check_permission
from database_manager import db_manager
from security_manager import backup_manager, report_manager
from typing import List, Dict
import os
from pathlib import Path

router = APIRouter(prefix="/admin", tags=["Admin"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/backup")
def create_backup(backup_type: str = "manual", current_user = Depends(get_current_user)):
    check_permission(current_user, ["admin"])
    
    try:
        backup_path = backup_manager.create_manual_backup() if backup_type == "manual" else backup_manager.create_automatic_backup()
        db_manager.log_audit(
            username=current_user.username,
            action="CREATE_BACKUP",
            details=f"Backup {backup_type} criado: {backup_path}"
        )
        
        return {
            "message": "Backup criado com sucesso",
            "backup_path": backup_path,
            "backup_type": backup_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar backup: {str(e)}")

@router.get("/backups")
def list_backups(current_user = Depends(get_current_user)):
    check_permission(current_user, ["admin"])
    
    try:
        backups = backup_manager.get_backup_list()
        return {"backups": backups}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar backups: {str(e)}")

@router.post("/restore")
def restore_backup(backup_path: str, current_user = Depends(get_current_user)):
    check_permission(current_user, ["admin"])
    
    try:
        success = backup_manager.restore_from_backup(backup_path)
        
        if success:
            # Log da ação crítica
            db_manager.log_audit(
                username=current_user.username,
                action="RESTORE_BACKUP",
                details=f"Sistema restaurado a partir do backup: {backup_path}"
            )
            db_manager.add_alert(
                "SYSTEM_RESTORED",
                f"Sistema restaurado por {current_user.username} usando backup {backup_path}",
                "CRÍTICO"
            )
            
            return {"message": "Backup restaurado com sucesso"}
        else:
            raise HTTPException(status_code=400, detail="Falha ao restaurar backup")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao restaurar backup: {str(e)}")

@router.get("/reports/security")
def get_security_report(days: int = 30, current_user = Depends(get_current_user)):
    """Gera relatório de segurança"""
    check_permission(current_user, ["admin", "gerente"])
    
    try:
        report = report_manager.generate_security_report(days)
        
        db_manager.log_audit(
            username=current_user.username,
            action="VIEW_SECURITY_REPORT",
            details=f"Relatório de segurança acessado (últimos {days} dias)"
        )
        
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar relatório: {str(e)}")

@router.get("/reports/resources")
def get_resource_report(current_user = Depends(get_current_user)):
    """Gera relatório de recursos"""
    check_permission(current_user, ["admin", "gerente"])
    
    try:
        report = report_manager.generate_resource_report()
        
        db_manager.log_audit(
            username=current_user.username,
            action="VIEW_RESOURCE_REPORT",
            details="Relatório de recursos acessado"
        )
        
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar relatório: {str(e)}")

@router.get("/audit-logs")
def get_audit_logs(limit: int = 100, current_user = Depends(get_current_user)):
    """Busca logs de auditoria"""
    check_permission(current_user, ["admin"])
    
    try:
        logs = db_manager.get_audit_logs(limit)
        
        db_manager.log_audit(
            username=current_user.username,
            action="VIEW_AUDIT_LOGS",
            details=f"Logs de auditoria acessados (limite: {limit})"
        )
        
        return {"logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar logs: {str(e)}")

@router.get("/system-stats")
def get_system_stats(current_user = Depends(get_current_user)):
    """Retorna estatísticas do sistema"""
    check_permission(current_user, ["admin", "gerente"])
    
    try:
        stats = db_manager.get_dashboard_stats()
        
        db_size = os.path.getsize("wayne_secure.db") if os.path.exists("wayne_secure.db") else 0
        backup_dir = Path("backups")
        backup_count = len(list(backup_dir.glob("*.db"))) if backup_dir.exists() else 0
        
        stats.update({
            "database_size_mb": round(db_size / 1024 / 1024, 2),
            "backup_count": backup_count,
            "system_status": "online"
        })
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter estatísticas: {str(e)}")

@router.post("/cleanup-sessions")
def cleanup_sessions(current_user = Depends(get_current_user)):
    """Remove sessões expiradas"""
    check_permission(current_user, ["admin"])
    
    try:
        db_manager.cleanup_expired_sessions()
        
        # Log da limpeza
        db_manager.log_audit(
            username=current_user.username,
            action="CLEANUP_SESSIONS",
            details="Sessões expiradas removidas"
        )
        
        return {"message": "Sessões expiradas removidas com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na limpeza: {str(e)}")

@router.get("/users")
def list_all_users(current_user = Depends(get_current_user)):
    """Lista todos os usuários do sistema"""
    check_permission(current_user, ["admin"])
    
    try:
        # Busca estatísticas de usuários
        stats = db_manager.get_dashboard_stats()
        users_by_role = stats.get("users_by_role", {})
        
        return {
            "total_users": sum(users_by_role.values()),
            "users_by_role": users_by_role
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar usuários: {str(e)}")

@router.post("/create-user")
def create_user(username: str, password: str, role: str, current_user = Depends(get_current_user)):
    """Cria um novo usuário (apenas admins)"""
    check_permission(current_user, ["admin"])
    
    try:
        from auth import hash_password
        from security_manager import data_validator
        
        # Valida dados
        if not username or len(username) < 3:
            raise HTTPException(status_code=400, detail="Username deve ter pelo menos 3 caracteres")
        
        # Valida força da senha
        password_strength = data_validator.validate_password_strength(password)
        if not password_strength["is_strong"]:
            raise HTTPException(
                status_code=400, 
                detail="Senha muito fraca. Deve conter maiúscula, minúscula, número e caractere especial."
            )
        
        # Valida role
        valid_roles = ["admin", "gerente", "empregado", "user"]
        if role not in valid_roles:
            raise HTTPException(status_code=400, detail=f"Role deve ser um dos: {', '.join(valid_roles)}")
        
        # Cria usuário
        password_hash = hash_password(password)
        user_id = db_manager.add_user(username, password_hash, role)
        
        if user_id:
            # Log da criação
            db_manager.log_audit(
                username=current_user.username,
                action="CREATE_USER",
                details=f"Usuário {username} criado com role {role}"
            )
            
            return {"message": f"Usuário {username} criado com sucesso", "user_id": user_id}
        else:
            raise HTTPException(status_code=400, detail="Usuário já existe")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar usuário: {str(e)}")
