import React, { useEffect, useState } from "react";
import { addResource, editResource, removeResource } from "../services/api";

const ResourceManager = ({ user, onAuthError }) => {
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({
    name: "",
    status: "active",
    type: "server",
    description: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    async function fetchResources() {
      let realResources = [];
      if (user?.token) {
        try {
          const { getResources } = await import("../services/api");
          const response = await getResources(user.token);
          realResources = Array.isArray(response.data) ? response.data : [];
        } catch (error) {
        }
      }
      const demoResources = [
        { id: "demo-1", name: "Servidor Principal", status: "active", type: "server", description: "Servidor principal do sistema" },
        { id: "demo-2", name: "Base de Dados", status: "active", type: "database", description: "Base de dados primária" },
        { id: "demo-3", name: "Sistema de Backup", status: "inactive", type: "backup", description: "Sistema de backup automático" }
      ];
      setResources([...realResources, ...demoResources]);
    }
    fetchResources();
  }, [user]);

  const handleAddResource = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (user?.token) {
        const response = await addResource(user.token, newResource);
        setResources([...resources, { ...newResource, id: Date.now() }]);
      } else {
        setResources([...resources, { ...newResource, id: Date.now() }]);
      }
      setNewResource({ name: "", status: "active", type: "server", description: "" });
      setShowAddForm(false);
    } catch (error) {
      if (error.status === 401 && onAuthError) {
        onAuthError("Sessão expirada ou token inválido. Faça login novamente.");
      }
      console.error("Erro ao adicionar recurso:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (confirm("Tem certeza que deseja remover este recurso?")) {
      try {
        if (user?.token) {
          await removeResource(user.token, id);
        }
        setResources(resources.filter(r => r.id !== id));
      } catch (error) {
        if (error.status === 401 && onAuthError) {
          onAuthError("Sessão expirada ou token inválido. Faça login novamente.");
        }
        console.error("Erro ao remover recurso:", error);
      }
    }
  };

  const toggleResourceStatus = async (id) => {
    const resource = resources.find(r => r.id === id);
    const newStatus = resource.status === "active" ? "inactive" : "active";
    
    try {
      if (user?.token) {
        await editResource(user.token, id, { ...resource, status: newStatus });
      }
      setResources(resources.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
      ));
    } catch (error) {
      if (error.status === 401 && onAuthError) {
        onAuthError("Sessão expirada ou token inválido. Faça login novamente.");
      }
      console.error("Erro ao atualizar recurso:", error);
    }
  };

  return (
    <div className="resource-manager">
      <div className="resource-header">
        <h1>Gerenciamento de Recursos</h1>
        <button 
          className="add-resource-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancelar" : "Adicionar Recurso"}
        </button>
      </div>

      {showAddForm && (
        <div className="card add-resource-form">
          <h3 style={{color:'#00fff7'}}>Novo Recurso</h3>
          <form onSubmit={handleAddResource}>
            <div className="form-group">
              <label style={{color:'#00fff7'}}>Nome:</label>
              <input
                type="text"
                value={newResource.name}
                onChange={(e) => setNewResource({...newResource, name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label style={{color:'#00fff7'}}>Tipo:</label>
              <select
                value={newResource.type}
                onChange={(e) => setNewResource({...newResource, type: e.target.value})}
              >
                <option value="server">Servidor</option>
                <option value="database">Base de Dados</option>
                <option value="backup">Backup</option>
                <option value="network">Rede</option>
                <option value="security">Segurança</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{color:'#00fff7'}}>Status:</label>
              <select
                value={newResource.status}
                onChange={(e) => setNewResource({...newResource, status: e.target.value})}
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{color:'#00fff7'}}>Descrição:</label>
              <textarea
                value={newResource.description}
                onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                rows="3"
              />
            </div>

            <button type="submit" disabled={isLoading} className="add-resource-btn">
              {isLoading ? "Adicionando..." : "Adicionar"}
            </button>
          </form>
        </div>
      )}

      <div className="resources-grid">
        {resources.map(resource => (
          <div key={resource.id} className="card resource-card">
            <div className="resource-header-card">
              <h3 style={{color:'#00fff7'}}>{resource.name}</h3>
              <span className={`status-badge ${resource.status}`}>
                {resource.status === "active" ? "Ativo" : "Inativo"}
              </span>
            </div>
            
            <div className="resource-info">
              <p><strong>Tipo:</strong> <span style={{color:'#ffd700'}}>{resource.type}</span></p>
              <p><strong>Descrição:</strong> <span style={{color:'#e0e0e0'}}>{resource.description}</span></p>
            </div>

            <div className="resource-actions">
              <button 
                onClick={() => toggleResourceStatus(resource.id)}
                className={`status-toggle ${resource.status}`}
              >
                {resource.status === "active" ? "Desativar" : "Ativar"}
              </button>
              
              {user?.role === "ADMIN" && (
                <button 
                  onClick={() => handleDeleteResource(resource.id)}
                  className="delete-btn"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {resources.length === 0 && (
        <div className="empty-state">
          <p>Nenhum recurso encontrado.</p>
          <p>Clique em "Adicionar Recurso" para começar.</p>
        </div>
      )}
    </div>
  );
};

export default ResourceManager;
