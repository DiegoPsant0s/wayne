import sqlite3
from datetime import datetime
from pathlib import Path
import json
from typing import List, Dict, Optional
from models.user import User, UserRole
from schemas.resource import ResourceOut

class DatabaseManager:
    def __init__(self, db_path: str = "wayne_secure.db"):
        self.db_path = Path(db_path)
        self.init_database()
    
    def init_database(self):
        """Inicializa o banco de dados com as tabelas necessárias"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Tabela de usuários
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1
                )
            """)
            
            # Tabela de recursos
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS resources (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    type TEXT,
                    description TEXT,
                    status TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_by TEXT
                )
            """)
            
            # Tabela de alertas
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    alert_type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    level TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_resolved BOOLEAN DEFAULT 0,
                    resolved_by TEXT,
                    resolved_at TIMESTAMP
                )
            """)
            
            # Tabela de sessões ativas
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS active_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    token_hash TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Tabela de auditoria
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL,
                    action TEXT NOT NULL,
                    resource_type TEXT,
                    resource_id INTEGER,
                    details TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ip_address TEXT,
                    user_agent TEXT
                )
            """)
            
            # Tabela de backups
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS backups (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    backup_type TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    size_bytes INTEGER,
                    checksum TEXT
                )
            """)
            
            conn.commit()
            
    def create_backup(self, backup_type: str = "full") -> str:
        """Cria um backup do banco de dados"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = Path(f"backups/backup_{backup_type}_{timestamp}.db")
        backup_path.parent.mkdir(exist_ok=True)
        
        # Copia o banco atual
        import shutil
        shutil.copy2(self.db_path, backup_path)
        
        # Registra o backup
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO backups (backup_type, file_path, size_bytes)
                VALUES (?, ?, ?)
            """, (backup_type, str(backup_path), backup_path.stat().st_size))
            conn.commit()
            
        return str(backup_path)
    
    def restore_backup(self, backup_path: str) -> bool:
        """Restaura um backup do banco de dados"""
        try:
            backup_file = Path(backup_path)
            if not backup_file.exists():
                return False
                
            # Cria backup do estado atual antes de restaurar
            self.create_backup("pre_restore")
            
            # Restaura o backup
            import shutil
            shutil.copy2(backup_file, self.db_path)
            
            return True
        except Exception as e:
            print(f"Erro ao restaurar backup: {e}")
            return False
    
    def add_user(self, username: str, password_hash: str, role: str) -> Optional[int]:
        """Adiciona um novo usuário ao banco (sempre ativo)"""
        # Backup do SQL anterior para reversão:
        # cursor.execute("""
        #     INSERT INTO users (username, password_hash, role)
        #     VALUES (?, ?, ?)
        # """, (username, password_hash, role))
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""
                    INSERT INTO users (username, password_hash, role, is_active)
                    VALUES (?, ?, ?, 1)
                """, (username, password_hash, role))
                conn.commit()
                return cursor.lastrowid
            except sqlite3.IntegrityError:
                return None
    
    def get_user(self, username: str) -> Optional[Dict]:
        """Busca um usuário pelo username"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, username, password_hash, role, created_at, last_login, is_active
                FROM users WHERE username = ? AND is_active = 1
            """, (username,))
            row = cursor.fetchone()
            
            if row:
                return {
                    "id": row[0],
                    "username": row[1],
                    "password_hash": row[2],
                    "role": row[3],
                    "created_at": row[4],
                    "last_login": row[5],
                    "is_active": row[6]
                }
            return None
    
    def update_last_login(self, username: str):
        """Atualiza o último login do usuário"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE users SET last_login = CURRENT_TIMESTAMP
                WHERE username = ?
            """, (username,))
            conn.commit()
    
    def add_resource(self, name: str, type: str, description: str, status: str, created_by: str) -> int:
        """Adiciona um novo recurso"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO resources (name, type, description, status, created_by)
                VALUES (?, ?, ?, ?, ?)
            """, (name, type, description, status, created_by))
            conn.commit()
            return cursor.lastrowid
    
    def get_resources(self) -> List[Dict]:
        """Busca todos os recursos"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, type, description, status, created_at, updated_at, created_by
                FROM resources ORDER BY created_at DESC
            """)
            rows = cursor.fetchall()
            
            return [
                {
                    "id": row[0],
                    "name": row[1],
                    "type": row[2],
                    "description": row[3],
                    "status": row[4],
                    "created_at": row[5],
                    "updated_at": row[6],
                    "created_by": row[7]
                }
                for row in rows
            ]
    
    def update_resource(self, resource_id: int, name: str, type: str, description: str, status: str) -> bool:
        """Atualiza um recurso existente"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE resources 
                SET name = ?, type = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (name, type, description, status, resource_id))
            conn.commit()
            return cursor.rowcount > 0
    
    def delete_resource(self, resource_id: int) -> bool:
        """Remove um recurso"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM resources WHERE id = ?", (resource_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def add_alert(self, alert_type: str, message: str, level: str) -> int:
        """Adiciona um novo alerta"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO alerts (alert_type, message, level)
                VALUES (?, ?, ?)
            """, (alert_type, message, level))
            conn.commit()
            return cursor.lastrowid
    
    def get_alerts(self, include_resolved: bool = False) -> List[Dict]:
        """Busca alertas"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            if include_resolved:
                cursor.execute("""
                    SELECT id, alert_type, message, level, timestamp, is_resolved, resolved_by, resolved_at
                    FROM alerts ORDER BY timestamp DESC
                """)
            else:
                cursor.execute("""
                    SELECT id, alert_type, message, level, timestamp, is_resolved, resolved_by, resolved_at
                    FROM alerts WHERE is_resolved = 0 ORDER BY timestamp DESC
                """)
            
            rows = cursor.fetchall()
            return [
                {
                    "id": row[0],
                    "type": row[1],
                    "message": row[2],
                    "level": row[3],
                    "timestamp": row[4],
                    "is_resolved": row[5],
                    "resolved_by": row[6],
                    "resolved_at": row[7]
                }
                for row in rows
            ]
    
    def resolve_alert(self, alert_id: int, resolved_by: str) -> bool:
        """Marca um alerta como resolvido"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE alerts 
                SET is_resolved = 1, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (resolved_by, alert_id))
            conn.commit()
            return cursor.rowcount > 0
    
    def log_audit(self, username: str, action: str, resource_type: str = None, 
                  resource_id: int = None, details: str = None, ip_address: str = None, 
                  user_agent: str = None):
        """Registra uma ação de auditoria"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO audit_log (username, action, resource_type, resource_id, details, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (username, action, resource_type, resource_id, details, ip_address, user_agent))
            conn.commit()
    
    def get_audit_logs(self, limit: int = 100) -> List[Dict]:
        """Busca logs de auditoria"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, username, action, resource_type, resource_id, details, timestamp, ip_address, user_agent
                FROM audit_log ORDER BY timestamp DESC LIMIT ?
            """, (limit,))
            
            rows = cursor.fetchall()
            return [
                {
                    "id": row[0],
                    "username": row[1],
                    "action": row[2],
                    "resource_type": row[3],
                    "resource_id": row[4],
                    "details": row[5],
                    "timestamp": row[6],
                    "ip_address": row[7],
                    "user_agent": row[8]
                }
                for row in rows
            ]
    
    def add_session(self, username: str, token_hash: str, expires_at: datetime) -> int:
        """Adiciona uma sessão ativa"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO active_sessions (username, token_hash, expires_at)
                VALUES (?, ?, ?)
            """, (username, token_hash, expires_at.isoformat()))
            conn.commit()
            return cursor.lastrowid
    
    def invalidate_session(self, token_hash: str) -> bool:
        """Invalida uma sessão"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM active_sessions WHERE token_hash = ?", (token_hash,))
            conn.commit()
            return cursor.rowcount > 0
    
    def is_session_valid(self, token_hash: str) -> bool:
        """Verifica se uma sessão é válida"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) FROM active_sessions 
                WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP
            """, (token_hash,))
            return cursor.fetchone()[0] > 0
    
    def cleanup_expired_sessions(self):
        """Remove sessões expiradas"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM active_sessions WHERE expires_at <= CURRENT_TIMESTAMP")
            conn.commit()
    
    def get_dashboard_stats(self) -> Dict:
        """Retorna estatísticas para o dashboard"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Contadores de recursos por status
            cursor.execute("""
                SELECT status, COUNT(*) FROM resources GROUP BY status
            """)
            resource_stats = dict(cursor.fetchall())
            
            # Contadores de usuários por role
            cursor.execute("""
                SELECT role, COUNT(*) FROM users WHERE is_active = 1 GROUP BY role
            """)
            user_stats = dict(cursor.fetchall())
            
            # Total de alertas não resolvidos
            cursor.execute("SELECT COUNT(*) FROM alerts WHERE is_resolved = 0")
            unresolved_alerts = cursor.fetchone()[0]
            
            # Total de recursos
            cursor.execute("SELECT COUNT(*) FROM resources")
            total_resources = cursor.fetchone()[0]
            
            return {
                "resources_by_status": resource_stats,
                "users_by_role": user_stats,
                "unresolved_alerts": unresolved_alerts,
                "total_resources": total_resources
            }

# Instância global do gerenciador de banco
db_manager = DatabaseManager()

# Função utilitária para buscar usuário pelo username e retornar objeto User
def get_user_by_username(username: str):
    user_data = db_manager.get_user(username)
    if user_data:
        # Corrige para usar o campo correto do modelo User
        return User(
            username=user_data["username"],
            password=user_data["password_hash"],
            role=user_data["role"]
        )
    return None
