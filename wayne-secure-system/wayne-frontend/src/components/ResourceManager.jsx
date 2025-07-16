import React, { useEffect, useState, useCallback } from "react";
import { getResources, addResource, editResource, removeResource } from "../services/api";

const ResourceManager = ({ token, userRole }) => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [newResource, setNewResource] = useState({
    name: "",
    status: "active",
    type: "",
    description: ""
  });
  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // "grid" ou "list"
  // Agora seleciona por ID, não por índice
  const [selectedResources, setSelectedResources] = useState([]);

  // Funções para operações em lote
  const selectAllResources = useCallback(() => {
    setSelectedResources(filteredResources.map(resource => resource.id));
  }, [filteredResources]);

  const deselectAllResources = useCallback(() => {
    setSelectedResources([]);
  }, []);

  const toggleResourceSelection = useCallback((index) => {
    setSelectedResources(prev => 
      prev.includes(index)
        ? prev.filter(id => id !== index)
        : [...prev, index]
    );
  }, []);

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedResources.length === 0) return;
    setIsLoading(true);
    try {
      const promises = selectedResources.map(id => {
        const resource = resources.find(r => r.id === id);
        return editResource(token, id, { ...resource, status: newStatus });
      });
      await Promise.all(promises);
      await fetchResources();
      setSelectedResources([]);
      addNotification(`${selectedResources.length} recursos atualizados para ${newStatus}!`, "success");
    } catch (error) {
      console.error("Erro ao atualizar recursos em lote:", error);
      addNotification("Erro ao atualizar recursos em lote", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedResources.length === 0) return;
    const confirmed = window.confirm(
      `Deseja remover ${selectedResources.length} recursos selecionados? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;
    setIsLoading(true);
    try {
      // Remove por ID
      const promises = selectedResources.map(id => removeResource(token, id));
      await Promise.all(promises);
      await fetchResources();
      setSelectedResources([]);
      addNotification(`${selectedResources.length} recursos removidos!`, "success");
    } catch (error) {
      console.error("Erro ao remover recursos em lote:", error);
      addNotification("Erro ao remover recursos em lote", "error");
    } finally {
      setIsLoading(false);
    }
  };


  // Sistema de notificações
  const addNotification = useCallback((message, type = "info") => {
    // Gera um id único usando timestamp + Math.random()
    const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const notification = { id, message, type, timestamp: new Date() };
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  // Função para exportar recursos
  const exportResources = useCallback(() => {
    const dataToExport = filteredResources.length > 0 ? filteredResources : resources;
    const csvContent = [
      ["Nome", "Tipo", "Status", "Descrição"].join(","),
      ...dataToExport.map(resource => [
        `"${resource.name}"`,
        `"${resource.type}"`,
        `"${resource.status}"`,
        `"${resource.description || ""}"`
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recursos_wayne_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addNotification(`${dataToExport.length} recursos exportados!`, "success");
  }, [filteredResources, resources, addNotification]);

  // Carrega recursos do backend
  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    try {
      // Valida token antes de buscar recursos
      if (!token) {
        addNotification("Sessão expirada ou token ausente. Faça login novamente.", "error");
        setResources([]);
        setIsLoading(false);
        return;
      }
      let tokenAge = Infinity;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.exp) {
          tokenAge = (payload.exp * 1000 - Date.now()) / 1000;
        }
      } catch (e) {
        addNotification("Token inválido. Faça login novamente.", "error");
        setResources([]);
        setIsLoading(false);
        return;
      }
      if (tokenAge < 0 || tokenAge > 2700) {
        addNotification("Sessão expirada. Faça login novamente.", "error");
        setResources([]);
        setIsLoading(false);
        return;
      }
      const res = await getResources(token);
      console.log("[DEBUG] Resposta da API /resources/:", res);
      if (res.status === 401 || res.status === 403) {
        addNotification("Sessão expirada ou token inválido. Faça login novamente.", "error");
        setResources([]);
        setIsLoading(false);
        return;
      }
      if (res.data && Array.isArray(res.data.data)) {
        setResources(res.data.data);
        console.log("[DEBUG] Recursos recebidos:", res.data.data);
      } else {
        setResources([]);
        addNotification("Nenhum recurso cadastrado ou erro de conexão.", "error");
        console.log("[DEBUG] Resposta inesperada da API:", res);
      }
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        addNotification("Sessão expirada ou token inválido. Faça login novamente.", "error");
      } else {
        addNotification("Erro ao carregar recursos: " + (error?.message || "Erro desconhecido"), "error");
      }
      setResources([]);
      console.error("[DEBUG] Erro ao carregar recursos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, addNotification]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Melhora mensagem de erro detalhada
  useEffect(() => {
    if (resources.length === 0 && !isLoading) {
      if (searchTerm || statusFilter !== "all" || typeFilter !== "all") {
        addNotification("Nenhum recurso encontrado com os filtros atuais.", "warning");
      } else {
        addNotification("Nenhum recurso cadastrado ou erro de conexão.", "error");
      }
    }
  }, [resources, isLoading, searchTerm, statusFilter, typeFilter, addNotification]);


  // Filtrar e ordenar recursos
  useEffect(() => {
    let filtered = resources.filter(resource => {
      const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || resource.status === statusFilter;
      const matchesType = typeFilter === "all" || resource.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue = a[sortBy]?.toLowerCase() || "";
      let bValue = b[sortBy]?.toLowerCase() || "";
      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    setFilteredResources(filtered);
  }, [resources, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  // Botão para limpar filtros
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setSortBy("name");
    setSortOrder("asc");
  };

  // Validação do formulário
  const validateResource = (resource) => {
    if (!resource.name.trim()) {
      addNotification("Nome do recurso é obrigatório", "error");
      return false;
    }
    if (!resource.type.trim()) {
      addNotification("Tipo do recurso é obrigatório", "error");
      return false;
    }
    if (resource.name.length < 3) {
      addNotification("Nome deve ter pelo menos 3 caracteres", "error");
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateResource(newResource)) return;
    setIsLoading(true);
    try {
      await addResource(token, {
        name: newResource.name.trim(),
        status: newResource.status,
        type: newResource.type.trim(),
        description: newResource.description.trim()
      });
      await fetchResources();
      setNewResource({ name: "", status: "active", type: "", description: "" });
      setShowAddForm(false);
      addNotification("Recurso adicionado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao adicionar recurso:", error);
      addNotification("Erro ao adicionar recurso: " + (error?.response?.data?.message || error?.message || "Erro desconhecido"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (idx) => {
    // idx agora é o id do recurso
    const resource = resources.find(r => r.id === idx);
    setEditingResource({ ...resource });
  };

  const handleSaveEdit = async () => {
    if (!validateResource(editingResource)) return;
    setIsLoading(true);
    try {
      await editResource(token, editingResource.id, {
        name: editingResource.name.trim(),
        status: editingResource.status,
        type: editingResource.type.trim(),
        description: editingResource.description.trim()
      });
      await fetchResources();
      setEditingResource(null);
      addNotification("Recurso atualizado com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao editar recurso:", error);
      addNotification("Erro ao editar recurso", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (idx) => {
    if (window.confirm("Deseja remover este recurso? Esta ação não pode ser desfeita.")) {
      setIsLoading(true);
      try {
        await removeResource(token, idx);
        await fetchResources();
        addNotification("Recurso removido com sucesso!", "success");
      } catch (error) {
        console.error("Erro ao remover recurso:", error);
        addNotification("Erro ao remover recurso", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const canEdit = userRole === "admin" || userRole === "gerente";
  const uniqueTypes = [...new Set(resources.map(r => r.type).filter(Boolean))];

  // Estatísticas
  const stats = {
    total: resources.length,
    active: resources.filter(r => r.status === "active").length,
    maintenance: resources.filter(r => r.status === "maintenance").length,
    inactive: resources.filter(r => r.status === "inactive").length,
    // Estatísticas por tipo
    typeStats: resources.reduce((acc, resource) => {
      acc[resource.type] = (acc[resource.type] || 0) + 1;
      return acc;
    }, {}),
    // Últimos adicionados (baseado no índice - assumindo que os últimos têm índices maiores)
    recentResources: resources.slice(-5).reverse()
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Sistema de Notificações */}
      <NotificationSystem notifications={notifications} />
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}
      {/* O restante da interface permanece igual */}
      <div style={{ 
        background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%)", 
        borderRadius: 16, 
        padding: 32,
        border: "2px solid #ff1a1a",
        boxShadow: "0 0 20px rgba(255, 26, 26, 0.3)"
      }}>
        <ResourceStats stats={stats} />
        <ResourceList
          resources={filteredResources}
          originalResources={resources}
          canEdit={canEdit}
          viewMode={viewMode}
          selectedResources={selectedResources}
          onToggleSelection={toggleResourceSelection}
          onEdit={handleEdit}
          onRemove={handleRemove}
        />
      </div>
      {editingResource && (
        <EditResourceModal
          resource={editingResource}
          setResource={setEditingResource}
          onSave={handleSaveEdit}
          onCancel={() => setEditingResource(null)}
        />
      )}
    </div>
  );
};

// Componente de Estatísticas Melhorado
function ResourceStats({ stats }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Estatísticas principais */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: 16, 
        marginBottom: 20 
      }}>
        <StatCard title="Total" value={stats.total} color="#00eaff" icon="📊" />
        <StatCard title="Ativos" value={stats.active} color="#00C851" icon="✅" />
        <StatCard title="Manutenção" value={stats.maintenance} color="#ffbb33" icon="🔧" />
        <StatCard title="Inativos" value={stats.inactive} color="#ff4444" icon="❌" />
      </div>
      
      {/* Estatísticas detalhadas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 16
      }}>
        {/* Distribuição por tipo */}
        {Object.keys(stats.typeStats).length > 0 && (
          <div style={{
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #333"
          }}>
            <h4 style={{ color: "#00eaff", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              📈 Distribuição por Tipo
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(stats.typeStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: "rgba(255, 26, 26, 0.1)",
                    borderRadius: 6
                  }}>
                    <span style={{ color: "#fff", fontSize: 14 }}>{type}</span>
                    <span style={{ 
                      color: "#ff1a1a", 
                      fontWeight: "bold",
                      background: "rgba(255, 26, 26, 0.2)",
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 12
                    }}>
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {/* Recursos recentes */}
        {stats.recentResources.length > 0 && (
          <div style={{
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #333"
          }}>
            <h4 style={{ color: "#00eaff", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              🕒 Últimos Recursos
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.recentResources.slice(0, 3).map((resource, idx) => (
                <div key={idx} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  background: "rgba(0, 234, 255, 0.1)",
                  borderRadius: 6
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: resource.status === "active" ? "#00C851" : 
                               resource.status === "maintenance" ? "#ffbb33" : "#ff4444"
                  }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontSize: 14, fontWeight: "bold" }}>
                      {resource.name}
                    </div>
                    <div style={{ color: "#ccc", fontSize: 12 }}>
                      {resource.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color, icon }) {
  return (
    <div style={{
      background: "rgba(255, 255, 255, 0.05)",
      border: `2px solid ${color}`,
      borderRadius: 12,
      padding: 20,
      textAlign: "center",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      cursor: "pointer"
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = `0 8px 16px ${color}33`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: "bold", color: color, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ color: "#ccc", fontSize: 14 }}>{title}</div>
    </div>
  );
}

// Componente de Barra de Ferramentas para Operações em Lote
function BulkActionsToolbar({ 
  selectedCount, 
  totalCount, 
  onSelectAll, 
  onDeselectAll, 
  onBulkStatusChange, 
  onBulkDelete 
}) {
  if (selectedCount === 0) return null;

  return (
    <div style={{
      background: "rgba(255, 26, 26, 0.1)",
      border: "2px solid #ff1a1a",
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ color: "#ff1a1a", fontWeight: "bold" }}>
          {selectedCount} de {totalCount} selecionados
        </div>
        
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
            style={{
              background: "#333",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: 6,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12
            }}
          >
            {selectedCount === totalCount ? "Deselecionar Todos" : "Selecionar Todos"}
          </button>
        </div>
      </div>
      
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => onBulkStatusChange("active")}
          style={{
            background: "#00C851",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: "bold"
          }}
        >
          ✅ Ativar
        </button>
        
        <button
          onClick={() => onBulkStatusChange("maintenance")}
          style={{
            background: "#ffbb33",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: "bold"
          }}
        >
          🔧 Manutenção
        </button>
        
        <button
          onClick={() => onBulkStatusChange("inactive")}
          style={{
            background: "#888",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: "bold"
          }}
        >
          ❌ Inativar
        </button>
        
        <button
          onClick={onBulkDelete}
          style={{
            background: "#ff4444",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: "bold"
          }}
        >
          🗑️ Remover
        </button>
      </div>
    </div>
  );
}

// Componente de Formulário de Adição
function AddResourceForm({ newResource, setNewResource, onAdd, onCancel }) {
  return (
    <div style={{
      background: "rgba(0, 0, 0, 0.3)",
      borderRadius: 12,
      padding: 24,
      marginBottom: 32,
      border: "2px solid #00eaff",
      boxShadow: "0 0 15px rgba(0, 234, 255, 0.2)"
    }}>
      <h3 style={{ color: "#00eaff", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        ➕ Adicionar Novo Recurso
      </h3>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div>
          <label style={{ display: "block", color: "#ccc", marginBottom: 8, fontSize: 14 }}>
            Nome do Recurso *
          </label>
          <input
            type="text"
            placeholder="Ex: Servidor Principal"
            value={newResource.name}
            onChange={e => setNewResource({ ...newResource, name: e.target.value })}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "2px solid #333",
              background: "#1a1a2e",
              color: "#fff",
              fontSize: 16,
              transition: "border-color 0.2s ease",
              boxSizing: "border-box"
            }}
            onFocus={e => e.target.style.borderColor = "#00eaff"}
            onBlur={e => e.target.style.borderColor = "#333"}
          />
        </div>
        
        <div>
          <label style={{ display: "block", color: "#ccc", marginBottom: 8, fontSize: 14 }}>
            Tipo *
          </label>
          <input
            type="text"
            placeholder="Ex: Servidor, Rede, Hardware"
            value={newResource.type}
            onChange={e => setNewResource({ ...newResource, type: e.target.value })}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "2px solid #333",
              background: "#1a1a2e",
              color: "#fff",
              fontSize: 16,
              transition: "border-color 0.2s ease",
              boxSizing: "border-box"
            }}
            onFocus={e => e.target.style.borderColor = "#00eaff"}
            onBlur={e => e.target.style.borderColor = "#333"}
          />
        </div>
        
        <div>
          <label style={{ display: "block", color: "#ccc", marginBottom: 8, fontSize: 14 }}>
            Status
          </label>
          <select
            value={newResource.status}
            onChange={e => setNewResource({ ...newResource, status: e.target.value })}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "2px solid #333",
              background: "#1a1a2e",
              color: "#fff",
              fontSize: 16,
              boxSizing: "border-box"
            }}
          >
            <option value="active">✅ Ativo</option>
            <option value="maintenance">🔧 Manutenção</option>
            <option value="inactive">❌ Inativo</option>
          </select>
        </div>
      </div>
      
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", color: "#ccc", marginBottom: 8, fontSize: 14 }}>
          Descrição
        </label>
        <textarea
          placeholder="Descrição detalhada do recurso..."
          value={newResource.description}
          onChange={e => setNewResource({ ...newResource, description: e.target.value })}
          rows={3}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            border: "2px solid #333",
            background: "#1a1a2e",
            color: "#fff",
            fontSize: 16,
            resize: "vertical",
            transition: "border-color 0.2s ease",
            boxSizing: "border-box"
          }}
          onFocus={e => e.target.style.borderColor = "#00eaff"}
          onBlur={e => e.target.style.borderColor = "#333"}
        />
      </div>
      
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onAdd}
          style={{
            background: "#00C851",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            cursor: "pointer",
            fontSize: 16,
            fontWeight: "bold",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
          onMouseEnter={e => e.target.style.background = "#00a844"}
          onMouseLeave={e => e.target.style.background = "#00C851"}
        >
          ✅ Adicionar Recurso
        </button>
        
        <button
          onClick={onCancel}
          style={{
            background: "#666",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            cursor: "pointer",
            fontSize: 16,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={e => e.target.style.background = "#555"}
          onMouseLeave={e => e.target.style.background = "#666"}
        >
          ❌ Cancelar
        </button>
      </div>
    </div>
  );
}

// Componente de Filtros e Busca
function SearchAndFilters({ 
  searchTerm, setSearchTerm, 
  statusFilter, setStatusFilter, 
  typeFilter, setTypeFilter, 
  uniqueTypes, 
  sortBy, setSortBy, 
  sortOrder, setSortOrder 
}) {
  return (
    <div style={{
      background: "rgba(0, 0, 0, 0.2)",
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      border: "1px solid #333"
    }}>
      <h4 style={{ color: "#fff", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        🔍 Filtros e Busca
      </h4>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {/* Busca */}
        <div>
          <label style={{ display: "block", color: "#ccc", marginBottom: 8, fontSize: 14 }}>
            Buscar
          </label>
          <input
            type="text"
            placeholder="Nome, tipo ou descrição..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid #555",
              background: "#2a2a3e",
              color: "#fff",
              fontSize: 14,
              boxSizing: "border-box"
            }}
          />
        </div>
        
        {/* Filtro por Status */}
        <div>
          <label style={{ display: "block", color: "#ccc", marginBottom: 8, fontSize: 14 }}>
            Status
          </label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid #555",
              background: "#2a2a3e",
              color: "#fff",
              fontSize: 14,
              boxSizing: "border-box"
            }}
          >
            <option value="all">Todos</option>
            <option value="active">✅ Ativos</option>
            <option value="maintenance">🔧 Manutenção</option>
            <option value="inactive">❌ Inativos</option>
          </select>
        </div>
        
        {/* Filtro por Tipo */}
        <div>
          <label style={{ display: "block", color: "#ccc", marginBottom: 8, fontSize: 14 }}>
            Tipo
          </label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid #555",
              background: "#2a2a3e",
              color: "#fff",
              fontSize: 14,
              boxSizing: "border-box"
            }}
          >
            <option value="all">Todos os tipos</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        {/* Ordenação */}
        <div>
          <label style={{ display: "block", color: "#ccc", marginBottom: 8, fontSize: 14 }}>
            Ordenar por
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 6,
                border: "1px solid #555",
                background: "#2a2a3e",
                color: "#fff",
                fontSize: 14,
                boxSizing: "border-box"
              }}
            >
              <option value="name">Nome</option>
              <option value="type">Tipo</option>
              <option value="status">Status</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              style={{
                background: "#ff1a1a",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "10px 12px",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: "bold",
                minWidth: 60
              }}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de Lista de Recursos
function ResourceList({ 
  resources, 
  originalResources, 
  canEdit, 
  viewMode, 
  selectedResources, 
  onToggleSelection, 
  onEdit, 
  onRemove 
}) {
  if (resources.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: 60,
        color: "#888",
        background: "rgba(0, 0, 0, 0.2)",
        borderRadius: 12,
        border: "2px dashed #333"
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>Nenhum recurso encontrado</div>
        <div style={{ fontSize: 14 }}>
          {originalResources.length === 0 
            ? "Adicione seu primeiro recurso usando o botão acima" 
            : "Tente ajustar os filtros para encontrar recursos"}
        </div>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 20,
        marginTop: 20
      }}>
        {resources.map(resource => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            index={resource.id}
            canEdit={canEdit}
            isSelected={selectedResources.includes(resource.id)}
            onToggleSelection={onToggleSelection}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ))}
      </div>
    );
  }

  // Modo Lista
  return (
    <div style={{
      background: "rgba(0, 0, 0, 0.2)",
      borderRadius: 12,
      overflow: "hidden",
      border: "1px solid #333"
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: canEdit ? "50px 2fr 1fr 2fr 1fr 1fr" : "2fr 1fr 2fr 1fr",
        background: "#232526",
        padding: "16px 20px",
        fontWeight: "bold",
        color: "#00eaff",
        borderBottom: "2px solid #ff1a1a"
      }}>
        {canEdit && <div>☑️</div>}
        <div>📋 Nome</div>
        <div>🏷️ Tipo</div>
        <div>📝 Descrição</div>
        <div>📊 Status</div>
        <div>⚙️ Ações</div>
      </div>
      
      {resources.map(resource => (
        <ResourceRow
          key={resource.id}
          resource={resource}
          index={resource.id}
          canEdit={canEdit}
          isSelected={selectedResources.includes(resource.id)}
          onToggleSelection={onToggleSelection}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

// Componente de Card de Recurso (modo grid)
function ResourceCard({ 
  resource, 
  index, 
  canEdit, 
  isSelected, 
  onToggleSelection, 
  onEdit, 
  onRemove 
}) {
  const getStatusInfo = (status) => {
    switch(status) {
      case "active": return { color: "#00C851", icon: "✅", text: "Ativo" };
      case "maintenance": return { color: "#ffbb33", icon: "🔧", text: "Manutenção" };
      case "inactive": return { color: "#ff4444", icon: "❌", text: "Inativo" };
      default: return { color: "#888", icon: "❓", text: status };
    }
  };

  const statusInfo = getStatusInfo(resource.status);

  return (
    <div style={{
      background: isSelected 
        ? "linear-gradient(135deg, rgba(255, 26, 26, 0.2) 0%, rgba(0, 234, 255, 0.2) 100%)"
        : "rgba(26, 26, 46, 0.8)",
      border: isSelected 
        ? "2px solid #ff1a1a" 
        : "1px solid #333",
      borderRadius: 12,
      padding: 20,
      transition: "all 0.3s ease",
      position: "relative",
      cursor: "pointer",
      boxShadow: isSelected 
        ? "0 0 20px rgba(255, 26, 26, 0.3)" 
        : "0 4px 8px rgba(0,0,0,0.2)"
    }}
    onMouseEnter={e => {
      if (!isSelected) {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,234,255,0.2)";
        e.currentTarget.style.borderColor = "#00eaff";
      }
    }}
    onMouseLeave={e => {
      if (!isSelected) {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        e.currentTarget.style.borderColor = "#333";
      }
    }}>
      
      {/* Checkbox de seleção */}
      {canEdit && (
        <div style={{
          position: "absolute",
          top: 12,
          right: 12,
          cursor: "pointer"
        }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(index)}
            style={{
              width: 18,
              height: 18,
              cursor: "pointer"
            }}
          />
        </div>
      )}
      
      {/* Indicador de status */}
      <div style={{
        position: "absolute",
        top: 12,
        left: 12,
        background: statusInfo.color,
        color: "#fff",
        padding: "4px 8px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        gap: 4
      }}>
        {statusInfo.icon} {statusInfo.text}
      </div>
      
      {/* Conteúdo principal */}
      <div style={{ marginTop: 40 }}>
        <h3 style={{
          color: "#00eaff",
          margin: "0 0 8px 0",
          fontSize: 18,
          wordBreak: "break-word"
        }}>
          {resource.name}
        </h3>
        
        <div style={{
          background: "rgba(255, 26, 26, 0.1)",
          color: "#ff1a1a",
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: "bold",
          display: "inline-block",
          marginBottom: 12
        }}>
          🏷️ {resource.type}
        </div>
        
        <p style={{
          color: "#ccc",
          fontSize: 14,
          margin: "0 0 16px 0",
          lineHeight: 1.4,
          minHeight: 40,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden"
        }}>
          {resource.description || "Sem descrição"}
        </p>
        
        {/* Ações */}
        {canEdit && (
          <div style={{
            display: "flex",
            gap: 8,
            marginTop: 16
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(index);
              }}
              style={{
                flex: 1,
                background: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: 6,
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 12,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={e => {
                e.target.style.background = "#00eaff";
                e.target.style.color = "#000";
              }}
              onMouseLeave={e => {
                e.target.style.background = "#333";
                e.target.style.color = "#fff";
              }}
            >
              ✏️ Editar
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              style={{
                flex: 1,
                background: "#ff4444",
                color: "#fff",
                border: "1px solid #ff4444",
                borderRadius: 6,
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 12,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={e => e.target.style.background = "#cc3333"}
              onMouseLeave={e => e.target.style.background = "#ff4444"}
            >
              🗑️ Remover
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceRow({ 
  resource, 
  index, 
  canEdit, 
  isSelected, 
  onToggleSelection, 
  onEdit, 
  onRemove 
}) {
  const getStatusInfo = (status) => {
    switch(status) {
      case "active": return { color: "#00C851", icon: "✅", text: "Ativo" };
      case "maintenance": return { color: "#ffbb33", icon: "🔧", text: "Manutenção" };
      case "inactive": return { color: "#ff4444", icon: "❌", text: "Inativo" };
      default: return { color: "#888", icon: "❓", text: status };
    }
  };

  const statusInfo = getStatusInfo(resource.status);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: canEdit ? "50px 2fr 1fr 2fr 1fr 1fr" : "2fr 1fr 2fr 1fr",
      padding: "16px 20px",
      borderBottom: "1px solid #333",
      transition: "all 0.2s ease",
      color: "#fff",
      background: isSelected ? "rgba(255, 26, 26, 0.1)" : "transparent"
    }}
    onMouseEnter={e => {
      if (!isSelected) {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
      }
    }}
    onMouseLeave={e => {
      if (!isSelected) {
        e.currentTarget.style.background = "transparent";
      }
    }}>
      
      {/* Checkbox de seleção */}
      {canEdit && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(index)}
            style={{
              width: 16,
              height: 16,
              cursor: "pointer"
            }}
          />
        </div>
      )}
      
      <div style={{ 
        fontWeight: "bold", 
        color: "#00eaff",
        wordBreak: "break-word"
      }}>
        {resource.name}
      </div>
      
      <div style={{
        background: "rgba(255, 26, 26, 0.1)",
        color: "#ff1a1a",
        padding: "4px 8px",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
        width: "fit-content"
      }}>
        {resource.type}
      </div>
      
      <div style={{ 
        color: "#ccc",
        fontSize: 14,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }}>
        {resource.description || "Sem descrição"}
      </div>
      
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8
      }}>
        <span style={{
          background: statusInfo.color,
          color: "#fff",
          padding: "4px 8px",
          borderRadius: 12,
          fontSize: 12,
          fontWeight: "bold"
        }}>
          {statusInfo.icon} {statusInfo.text}
        </span>
      </div>
      
      {canEdit && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onEdit(index)}
            style={{
              background: "#333",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: 4,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={e => {
              e.target.style.background = "#00eaff";
              e.target.style.color = "#000";
            }}
            onMouseLeave={e => {
              e.target.style.background = "#333";
              e.target.style.color = "#fff";
            }}
          >
            ✏️
          </button>
          
          <button
            onClick={() => onRemove(index)}
            style={{
              background: "#ff4444",
              color: "#fff",
              border: "1px solid #ff4444",
              borderRadius: 4,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={e => e.target.style.background = "#cc3333"}
            onMouseLeave={e => e.target.style.background = "#ff4444"}
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}

// Modal de Edição
function EditResourceModal({ resource, setResource, onSave, onCancel }) {
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%)",
        padding: 32,
        borderRadius: 16,
        border: "2px solid #00eaff",
        boxShadow: "0 0 30px rgba(0, 234, 255, 0.3)",
        minWidth: 500,
        maxWidth: 600,
        color: "#fff"
      }}>
        <h2 style={{ color: "#00eaff", marginBottom: 24, textAlign: "center" }}>
          ✏️ Editar Recurso
        </h2>
        
        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <label style={{ display: "block", color: "#ccc", marginBottom: 8, fontSize: 14 }}>
              Nome do Recurso *
            </label>
            <input
              type="text"
              value={resource.name}
              onChange={e => setResource({ ...resource, name: e.target.value })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "2px solid #333",
                background: "#1a1a2e",
                color: "#fff",
                fontSize: 16,
                boxSizing: "border-box"
              }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", color: "#ccc", marginBottom: 8, fontSize: 14 }}>
              Tipo *
            </label>
            <input
              type="text"
              value={resource.type}
              onChange={e => setResource({ ...resource, type: e.target.value })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "2px solid #333",
                background: "#1a1a2e",
                color: "#fff",
                fontSize: 16,
                boxSizing: "border-box"
              }}
            />
          </div>
          
          <div>
            <label style={{ display: "block", color: "#ccc", marginBottom: 8, fontSize: 14 }}>
              Status
            </label>
            <select
              value={resource.status}
              onChange={e => setResource({ ...resource, status: e.target.value })}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "2px solid #333",
                background: "#1a1a2e",
                color: "#fff",
                fontSize: 16,
                boxSizing: "border-box"
              }}
            >
              <option value="active">✅ Ativo</option>
              <option value="maintenance">🔧 Manutenção</option>
              <option value="inactive">❌ Inativo</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: "block", color: "#ccc", marginBottom: 8, fontSize: 14 }}>
              Descrição
            </label>
            <textarea
              value={resource.description || ""}
              onChange={e => setResource({ ...resource, description: e.target.value })}
              rows={4}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "2px solid #333",
                background: "#1a1a2e",
                color: "#fff",
                fontSize: 16,
                resize: "vertical",
                boxSizing: "border-box"
              }}
            />
          </div>
          
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button
              onClick={onSave}
              style={{
                background: "#00C851",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px 24px",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: "bold"
              }}
            >
              ✅ Salvar Alterações
            </button>
            
            <button
              onClick={onCancel}
              style={{
                background: "#666",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "12px 24px",
                cursor: "pointer",
                fontSize: 16
              }}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sistema de Notificações
function NotificationSystem({ notifications }) {
  return (
    <div style={{
      position: "fixed",
      top: 20,
      right: 20,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          style={{
            background: getNotificationColor(notification.type),
            color: "#fff",
            padding: "12px 16px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            maxWidth: 300,
            fontSize: 14,
            transition: "all 0.3s ease"
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>
            {getNotificationIcon(notification.type)} {getNotificationTitle(notification.type)}
          </div>
          <div>{notification.message}</div>
        </div>
      ))}
    </div>
  );
}

function getNotificationColor(type) {
  switch(type) {
    case "success": return "#00C851";
    case "error": return "#ff4444";
    case "warning": return "#ffbb33";
    default: return "#33b5e5";
  }
}

function getNotificationIcon(type) {
  switch(type) {
    case "success": return "✅";
    case "error": return "❌";
    case "warning": return "⚠️";
    default: return "ℹ️";
  }
}

function getNotificationTitle(type) {
  switch(type) {
    case "success": return "Sucesso";
    case "error": return "Erro";
    case "warning": return "Aviso";
    default: return "Info";
  }
}

// Loading Overlay
function LoadingOverlay() {
  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      zIndex: 999
    }}>
      <div style={{
        background: "#1a1a2e",
        padding: 24,
        borderRadius: 12,
        textAlign: "center",
        color: "#fff",
        border: "2px solid #00eaff"
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: "4px solid #333",
          borderTop: "4px solid #00eaff",
          borderRadius: "50%",
          margin: "0 auto 16px",
          animation: "spin 1s linear infinite"
        }}></div>
        <div>Processando...</div>
      </div>
    </div>
  );
}

export default ResourceManager;