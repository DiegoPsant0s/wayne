#!/usr/bin/env python3
"""Script para adicionar alertas mockados ao sistema"""

from mock_alerts import add_alert

def add_mock_alerts():
    """Adiciona alertas de exemplo ao sistema"""
    
    # Alertas de nível ALTO
    add_alert("SEGURANÇA", "Tentativa de acesso não autorizado detectada", "ALTO")
    add_alert("SISTEMA", "Falha crítica no servidor principal", "ALTO")
    add_alert("REDE", "Perda de conectividade com sistemas externos", "ALTO")
    
    # Alertas de nível MÉDIO
    add_alert("RECURSOS", "Uso de CPU acima de 80%", "MÉDIO")
    add_alert("BACKUP", "Backup noturno falhou", "MÉDIO")
    add_alert("BANCO", "Lentidão na base de dados", "MÉDIO")
    
    # Alertas de nível BAIXO
    add_alert("MANUTENÇÃO", "Manutenção programada em 24h", "BAIXO")
    add_alert("ATUALIZAÇÃO", "Nova versão disponível", "BAIXO")
    add_alert("SISTEMA", "Log de auditoria quase cheio", "BAIXO")
    
    print("✅ Alertas mockados adicionados com sucesso!")

if __name__ == "__main__":
    add_mock_alerts()
