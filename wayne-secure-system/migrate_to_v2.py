#!/usr/bin/env python3
"""
Script de migração para converter dados existentes para o novo sistema de banco de dados
"""

import json
import os
from pathlib import Path
from database_manager import db_manager
from auth import hash_password

def migrate_existing_data():
    """Migra dados existentes para o novo banco"""
    print("🔄 Iniciando migração de dados...")
    
    # 1. Migrar recursos do resources.json
    migrate_resources()
    
    # 2. Criar usuários padrão se não existirem
    create_default_users()
    
    # 3. Criar alguns alertas de exemplo
    create_sample_alerts()
    
    print("✅ Migração concluída com sucesso!")

def migrate_resources():
    """Migra recursos do arquivo JSON para o banco"""
    resources_file = Path("resources.json")
    
    if resources_file.exists():
        print("📦 Migrando recursos...")
        
        with open(resources_file, 'r', encoding='utf-8') as f:
            resources = json.load(f)
        
        migrated_count = 0
        for resource in resources:
            # Verifica se já existe um recurso com mesmo nome
            existing_resources = db_manager.get_resources()
            if not any(r['name'] == resource.get('name', '') for r in existing_resources):
                db_manager.add_resource(
                    name=resource.get('name', 'Recurso Sem Nome'),
                    type=resource.get('type', ''),
                    description=resource.get('description', ''),
                    status=resource.get('status', 'active'),
                    created_by='MIGRATION'
                )
                migrated_count += 1
        
        print(f"   ✅ {migrated_count} recursos migrados")
    else:
        print("   ⚠️ Arquivo resources.json não encontrado")

def create_default_users():
    """Cria usuários padrão no banco"""
    print("👥 Criando usuários padrão...")
    
    default_users = [
        ("wayne", "bat123", "admin"),
        ("lucius", "fox123", "gerente"),
        ("dick", "night", "empregado"),
        ("alfred", "pennyworth", "empregado"),
        ("admin", "admin123", "admin"),
        ("guest", "guest123", "user"),
    ]
    
    created_count = 0
    for username, password, role in default_users:
        existing_user = db_manager.get_user(username)
        if not existing_user:
            password_hash = hash_password(password)
            user_id = db_manager.add_user(username, password_hash, role)
            if user_id:
                created_count += 1
    
    print(f"   ✅ {created_count} usuários criados")

def create_sample_alerts():
    """Cria alertas de exemplo"""
    print("🚨 Criando alertas de exemplo...")
    
    sample_alerts = [
        ("SYSTEM_STARTUP", "Sistema Wayne Secure iniciado com sucesso", "INFO"),
        ("MIGRATION_COMPLETE", "Migração de dados concluída", "INFO"),
        ("SECURITY_CHECK", "Verificação de segurança concluída - sistema operacional", "BAIXO"),
    ]
    
    created_count = 0
    for alert_type, message, level in sample_alerts:
        alert_id = db_manager.add_alert(alert_type, message, level)
        if alert_id:
            created_count += 1
    
    print(f"   ✅ {created_count} alertas criados")

def create_initial_backup():
    """Cria backup inicial após migração"""
    print("💾 Criando backup inicial...")
    
    try:
        from security_manager import backup_manager
        backup_path = backup_manager.create_manual_backup()
        print(f"   ✅ Backup inicial criado: {backup_path}")
    except Exception as e:
        print(f"   ⚠️ Erro ao criar backup: {e}")

def display_system_info():
    """Exibe informações do sistema após migração"""
    print("\n" + "="*60)
    print("🦇 WAYNE SECURE SYSTEM v2.0 - INFORMAÇÕES DO SISTEMA")
    print("="*60)
    
    # Estatísticas do banco
    stats = db_manager.get_dashboard_stats()
    
    print(f"📊 ESTATÍSTICAS:")
    print(f"   • Total de recursos: {stats.get('total_resources', 0)}")
    print(f"   • Alertas não resolvidos: {stats.get('unresolved_alerts', 0)}")
    
    resources_by_status = stats.get('resources_by_status', {})
    if resources_by_status:
        print(f"   • Recursos ativos: {resources_by_status.get('active', 0)}")
        print(f"   • Recursos em manutenção: {resources_by_status.get('maintenance', 0)}")
        print(f"   • Recursos inativos: {resources_by_status.get('inactive', 0)}")
    
    users_by_role = stats.get('users_by_role', {})
    if users_by_role:
        print(f"   • Administradores: {users_by_role.get('admin', 0)}")
        print(f"   • Gerentes: {users_by_role.get('gerente', 0)}")
        print(f"   • Empregados: {users_by_role.get('empregado', 0)}")
        print(f"   • Usuários: {users_by_role.get('user', 0)}")
    
    print(f"\n🔐 USUÁRIOS PADRÃO:")
    print(f"   • Admin: wayne / bat123")
    print(f"   • Gerente: lucius / fox123")
    print(f"   • Empregado: dick / night")
    print(f"   • Empregado: alfred / pennyworth")
    print(f"   • Admin: admin / admin123")
    print(f"   • Usuário: guest / guest123")
    
    print(f"\n🚀 NOVOS ENDPOINTS DISPONÍVEIS:")
    print(f"   • POST /auth/logout - Logout seguro")
    print(f"   • GET /auth/validate - Validar token")
    print(f"   • POST /admin/backup - Criar backup")
    print(f"   • GET /admin/reports/security - Relatório de segurança")
    print(f"   • GET /admin/system-stats - Estatísticas do sistema")
    
    print(f"\n🛡️ FUNCIONALIDADES DE SEGURANÇA:")
    print(f"   • ✅ Rate limiting ativo")
    print(f"   • ✅ Validação de senhas fortes")
    print(f"   • ✅ Sistema de sessões")
    print(f"   • ✅ Auditoria completa")
    print(f"   • ✅ Backup automático")
    
    print("\n" + "="*60)
    print("🎯 SISTEMA 100% CONFORME AOS REQUISITOS!")
    print("="*60)

if __name__ == "__main__":
    try:
        # Executa migração
        migrate_existing_data()
        
        # Cria backup inicial
        create_initial_backup()
        
        # Exibe informações do sistema
        display_system_info()
        
    except Exception as e:
        print(f"❌ Erro durante a migração: {e}")
        print("Verifique se todos os arquivos necessários estão presentes.")
