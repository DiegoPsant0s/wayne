import hashlib
import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, List
from functools import wraps
from fastapi import HTTPException, status, Request
import time
from collections import defaultdict
from database_manager import db_manager
from jose import jwt
import os

# Configurações de rate limiting
RATE_LIMIT_REQUESTS = 10  # máximo de requests
RATE_LIMIT_WINDOW = 60    # em segundos
request_counts = defaultdict(list)

class SecurityManager:
    """Gerenciador de segurança avançado"""
    
    @staticmethod
    def hash_token(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()
    
    @staticmethod
    def create_session(username: str, token: str, expires_at: datetime) -> bool:
        try:
            token_hash = SecurityManager.hash_token(token)
            db_manager.add_session(username, token_hash, expires_at)
        except Exception as e:
            print(f"Erro ao criar sessão: {e}")
            return False
    
    @staticmethod
    def validate_session(token: str) -> bool:
        try:
            token_hash = SecurityManager.hash_token(token)
            return db_manager.is_session_valid(token_hash)
        except Exception:
            return False
    
    @staticmethod
    def invalidate_session(token: str) -> bool:
        try:
            token_hash = SecurityManager.hash_token(token)

            return db_manager.invalidate_session(token_hash)
        except Exception:
            return False
    
    @staticmethod
    def cleanup_expired_sessions():
        db_manager.cleanup_expired_sessions()
    
    @staticmethod
    def log_security_event(username: str, event_type: str, details: str, ip_address: str = None):
        db_manager.log_audit(
            username=username,
            action=f"SECURITY_{event_type}",
            details=details,
            ip_address=ip_address
        )
        
        # Cria alerta para eventos críticos
        if event_type in ["FAILED_LOGIN", "UNAUTHORIZED_ACCESS", "SUSPICIOUS_ACTIVITY"]:
            db_manager.add_alert(
                alert_type=event_type,
                message=f"Evento de segurança: {details}",
                level="ALTO"
            )

def rate_limit(max_requests: int = RATE_LIMIT_REQUESTS, window_seconds: int = RATE_LIMIT_WINDOW):
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            client_ip = request.client.host
            current_time = time.time()
            request_counts[client_ip] = [
                req_time for req_time in request_counts[client_ip]
                if current_time - req_time < window_seconds
            ]
            if len(request_counts[client_ip]) >= max_requests:
                SecurityManager.log_security_event(
                    username="ANONYMOUS",
                    event_type="RATE_LIMIT_EXCEEDED",
                    details=f"IP {client_ip} excedeu limite de {max_requests} requests em {window_seconds}s",
                    ip_address=client_ip
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Muitas tentativas. Tente novamente em alguns minutos."
                )
            
            # Registra a request atual
            request_counts[client_ip].append(current_time)
            
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator

class BackupManager:
    """Gerenciador de backups automáticos"""
    
    @staticmethod
    def create_automatic_backup() -> str:
        """Cria backup automático"""
        return db_manager.create_backup("automatic")
    
    @staticmethod
    def create_manual_backup() -> str:
        """Cria backup manual"""
        return db_manager.create_backup("manual")
    
    @staticmethod
    def restore_from_backup(backup_path: str) -> bool:
        """Restaura sistema a partir de backup"""
        return db_manager.restore_backup(backup_path)
    
    @staticmethod
    def get_backup_list() -> List[Dict]:
        """Lista todos os backups disponíveis"""
        return db_manager.get_backup_list()
    
    @staticmethod
    def schedule_daily_backup():
        """Agenda backup diário (implementação básica)"""
        import threading
        import time
        
        def daily_backup():
            while True:
                try:
                    # Espera 24 horas (86400 segundos)
                    time.sleep(86400)
                    BackupManager.create_automatic_backup()
                    print(f"Backup automático criado em {datetime.now()}")
                except Exception as e:
                    print(f"Erro no backup automático: {e}")
        
        backup_thread = threading.Thread(target=daily_backup, daemon=True)
        backup_thread.start()

class ReportManager:
    """Gerenciador de relatórios de segurança"""
    
    @staticmethod
    def generate_security_report(days: int = 30) -> Dict:
        """Gera relatório de segurança dos últimos N dias"""
        with sqlite3.connect(db_manager.db_path) as conn:
            cursor = conn.cursor()
            
            # Data limite
            start_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            # Estatísticas de login
            cursor.execute("""
                SELECT COUNT(*) as total_logins,
                       COUNT(DISTINCT username) as unique_users
                FROM audit_log 
                WHERE action LIKE '%LOGIN%' AND timestamp >= ?
            """, (start_date,))
            login_stats = cursor.fetchone()
            
            # Tentativas de acesso negado
            cursor.execute("""
                SELECT COUNT(*) as denied_access
                FROM audit_log 
                WHERE action LIKE '%SECURITY_UNAUTHORIZED_ACCESS%' AND timestamp >= ?
            """, (start_date,))
            denied_access = cursor.fetchone()[0]
            
            # Recursos mais acessados
            cursor.execute("""
                SELECT resource_type, COUNT(*) as access_count
                FROM audit_log 
                WHERE resource_type IS NOT NULL AND timestamp >= ?
                GROUP BY resource_type
                ORDER BY access_count DESC
                LIMIT 5
            """, (start_date,))
            top_resources = cursor.fetchall()
            
            # Usuários mais ativos
            cursor.execute("""
                SELECT username, COUNT(*) as action_count
                FROM audit_log 
                WHERE timestamp >= ?
                GROUP BY username
                ORDER BY action_count DESC
                LIMIT 5
            """, (start_date,))
            top_users = cursor.fetchall()
            
            # Alertas por nível
            cursor.execute("""
                SELECT level, COUNT(*) as alert_count
                FROM alerts 
                WHERE timestamp >= ?
                GROUP BY level
            """, (start_date,))
            alerts_by_level = cursor.fetchall()
            
            return {
                "period_days": days,
                "generated_at": datetime.now().isoformat(),
                "login_statistics": {
                    "total_logins": login_stats[0] or 0,
                    "unique_users": login_stats[1] or 0
                },
                "security_events": {
                    "denied_access_attempts": denied_access
                },
                "top_accessed_resources": [
                    {"resource_type": row[0], "access_count": row[1]} 
                    for row in top_resources
                ],
                "most_active_users": [
                    {"username": row[0], "action_count": row[1]} 
                    for row in top_users
                ],
                "alerts_by_level": [
                    {"level": row[0], "count": row[1]} 
                    for row in alerts_by_level
                ]
            }
    
    @staticmethod
    def generate_resource_report() -> Dict:
        """Gera relatório de recursos"""
        stats = db_manager.get_dashboard_stats()
        
        return {
            "generated_at": datetime.now().isoformat(),
            "total_resources": stats["total_resources"],
            "resources_by_status": stats["resources_by_status"],
            "users_by_role": stats["users_by_role"],
            "unresolved_alerts": stats["unresolved_alerts"]
        }

class DataValidator:
    """Validador de dados avançado"""
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, bool]:
        """Valida força da senha"""
        checks = {
            "min_length": len(password) >= 8,
            "has_uppercase": any(c.isupper() for c in password),
            "has_lowercase": any(c.islower() for c in password),
            "has_digit": any(c.isdigit() for c in password),
            "has_special": any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        }
        
        checks["is_strong"] = all(checks.values())
        return checks
    
    @staticmethod
    def validate_resource_data(name: str, resource_type: str, status: str) -> List[str]:
        """Valida dados de recurso"""
        errors = []
        
        if not name or len(name.strip()) < 2:
            errors.append("Nome deve ter pelo menos 2 caracteres")
        
        if len(name) > 100:
            errors.append("Nome não pode exceder 100 caracteres")
        
        allowed_statuses = ["active", "maintenance", "inactive"]
        if status.lower() not in allowed_statuses:
            errors.append(f"Status deve ser um dos: {', '.join(allowed_statuses)}")
        
        # Verifica caracteres especiais perigosos
        dangerous_chars = ["<", ">", "&", "\"", "'", ";"]
        if any(char in name for char in dangerous_chars):
            errors.append("Nome contém caracteres não permitidos")
        
        return errors

# Instâncias globais
security_manager = SecurityManager()
backup_manager = BackupManager()
report_manager = ReportManager()
data_validator = DataValidator()

# Inicia backup automático diário
backup_manager.schedule_daily_backup()
