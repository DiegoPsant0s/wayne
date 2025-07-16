// Editar perfil
export const editUser = (token, username, role) =>
  api.put("/users/edit", { username, role }, {
    headers: { Authorization: `Bearer ${token}` }
  });

// Excluir perfil
export const deleteUser = (token, username) =>
  api.delete("/users/delete", {
    headers: { Authorization: `Bearer ${token}` },
    data: { username }
  });
import axios from "axios";


const api = axios.create({
  baseURL: "http://localhost:8000",
});

// Interceptor para padronizar tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Erro da API
      return Promise.reject({
        status: error.response.status,
        data: error.response.data,
        message: error.response.data?.message || error.message,
      });
    }
    // Erro de rede ou desconhecido
    return Promise.reject({
      status: 0,
      message: "Erro de conexão com o servidor.",
    });
  }
);

// Autenticação
export const logout = (token) =>
  api.post("/auth/logout", {}, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const validateToken = (token) =>
  api.get("/auth/validate", {
    headers: { Authorization: `Bearer ${token}` }
  });

// Dashboard e alerts
export const getAlerts = (token) =>
  api.get("/dashboard/alerts", {
    headers: { Authorization: `Bearer ${token}` }
  });

export const deleteAlert = (alertId, token) =>
  api.delete(`/dashboard/alerts/${alertId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const editAlert = (alertId, data, token) =>
  api.put(`/dashboard/alerts/${alertId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getDashboard = (token) =>
  api.get("/dashboard/", {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getDashboardSummary = (token) =>
  api.get("/dashboard/summary", {
    headers: { Authorization: `Bearer ${token}` }
  });


// Recursos (resources)
export const getResources = (token) =>
  api.get("/resources/", {
    headers: { Authorization: `Bearer ${token}` }
  });

export const addResource = (token, resource) =>
  api.post("/resources/", resource, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const editResource = (token, idx, resource) =>
  api.put(`/resources/${idx}`, resource, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const removeResource = (token, idx) =>
  api.delete(`/resources/${idx}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

// Usuários (para gerenciamento de perfis)
export const getUsers = (token) =>
  api.get("/users/", {
    headers: { Authorization: `Bearer ${token}` }
  });

// Administração
export const createBackup = (token, backupType = "manual") =>
  api.post("/admin/backup", { backup_type: backupType }, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getBackups = (token) =>
  api.get("/admin/backups", {
    headers: { Authorization: `Bearer ${token}` }
  });

export const restoreBackup = (token, backupPath) =>
  api.post("/admin/restore", { backup_path: backupPath }, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getSecurityReport = (token, days = 30) =>
  api.get(`/admin/reports/security?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getResourceReport = (token) =>
  api.get("/admin/reports/resources", {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getSystemStats = (token) =>
  api.get("/admin/system-stats", {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getAuditLogs = (token, limit = 100) =>
  api.get(`/admin/audit-logs?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const createUser = (token, username, password, role) =>
  api.post("/admin/create-user", { username, password, role }, {
    headers: { Authorization: `Bearer ${token}` }
  });

// Alterar senha de usuário
export const changeUserPassword = (token, username, newPassword) =>
  api.put("/users/change-password", { username, new_password: newPassword }, {
    headers: { Authorization: `Bearer ${token}` }
  });

export default api;