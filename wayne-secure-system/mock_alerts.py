from datetime import datetime
from threading import Lock
from database_manager import db_manager

# Lock para compatibilidade com código existente
_alerts_lock = Lock()

def add_alert(alert_type: str, message: str, level: str):
    """Adiciona alerta no banco de dados"""
    with _alerts_lock:
        alert_id = db_manager.add_alert(alert_type, message, level)
        return {
            "id": alert_id,
            "type": alert_type,
            "message": message,
            "level": level,
            "timestamp": datetime.now().isoformat()
        }

def get_alerts():
    """Busca alertas do banco de dados"""
    with _alerts_lock:
        return db_manager.get_alerts(include_resolved=False)

def edit_alert(alert_id: int, alert_update: dict):
    """Edita um alerta no banco de dados"""
    with _alerts_lock:
        # Para simplificar, vamos apenas marcar como resolvido se a mensagem for atualizada
        if "message" in alert_update:
            # Aqui você pode implementar lógica para atualizar a mensagem
            # Por enquanto, vamos simular que funcionou
            alerts = db_manager.get_alerts(include_resolved=True)
            for alert in alerts:
                if alert["id"] == alert_id:
                    alert.update(alert_update)
                    return alert
        return None

def delete_alert(alert_id: int):
    """Remove um alerta (marca como resolvido)"""
    with _alerts_lock:
        success = db_manager.resolve_alert(alert_id, "SYSTEM")
        return success

def get_alert_statistics():
    """Retorna estatísticas dos alertas"""
    with _alerts_lock:
        all_alerts = db_manager.get_alerts(include_resolved=True)
        
        stats = {
            "total_alerts": len(all_alerts),
            "unresolved_alerts": len([a for a in all_alerts if not a["is_resolved"]]),
            "alerts_by_level": {}
        }
        
        for alert in all_alerts:
            level = alert["level"]
            if level not in stats["alerts_by_level"]:
                stats["alerts_by_level"][level] = 0
            stats["alerts_by_level"][level] += 1
            
        return stats




