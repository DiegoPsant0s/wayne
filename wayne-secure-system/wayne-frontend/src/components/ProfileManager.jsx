import React, { useEffect, useState } from "react";
import '../styles/cyberpunk.css';
import { getUsers, createUser, editUser, deleteUser, changeUserPassword } from '../services/api';

const roles = ["ADMIN", "GERENTE", "GUEST"];

const ProfileManager = ({ user, onAuthError }) => {
  const [profiles, setProfiles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [newProfile, setNewProfile] = useState({ username: "", password: "", role: "GUEST" });
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [passwordChange, setPasswordChange] = useState({ username: '', newPassword: '' });
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const token = user?.token;
  const canEdit = ["ADMIN", "GERENTE"].includes((user?.role || "").toUpperCase());
  const isSelf = (profile) => user?.username === profile.username;

  const formatRole = (role) => {
    if (!role) return '';
    const r = role.toUpperCase();
    if (r === 'ADMIN') return 'ADMIN';
    if (r === 'GERENTE') return 'GERENTE';
    if (r === 'EMPREGADO') return 'EMPREGADO';
    if (r === 'GUEST') return 'GUEST';
    return r;
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getUsers(token)
      .then(res => {
        let arr = [];
        if (Array.isArray(res.data)) arr = res.data;
        else if (Array.isArray(res.data?.data)) arr = res.data.data;
        else if (res.data?.data && typeof res.data.data === 'object') arr = [res.data.data];
        setProfiles(arr);
        setLoading(false);
      })
      .catch(err => {
        if (err.status === 401 && onAuthError) {
          onAuthError("Sessão expirada ou token inválido. Faça login novamente.");
        }
        setError("Erro ao carregar perfis: " + (err.message || ""));
        setLoading(false);
      });
  }, [token, onAuthError]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    setLoading(true);
    setError("");
    try {
      await createUser(token, newProfile.username, newProfile.password, newProfile.role);
      const res = await getUsers(token);
      setProfiles(res.data);
      setShowAdd(false);
      setNewProfile({ username: "", password: "", role: "GUEST" });
    } catch (err) {
      if (err.status === 401 && onAuthError) {
        onAuthError("Sessão expirada ou token inválido. Faça login novamente.");
      }
      setError("Erro ao criar perfil: " + (err.message || ""));
    }
    setLoading(false);
  };

  const handleEdit = (id) => {
    setEditing(id);
    const profile = profiles.find(p => p.id === id || p.username === id);
    setNewProfile({ username: profile.username, password: "", role: profile.role });
  };

  const handleSave = async (id) => {
    if (!canEdit) return;
    setLoading(true);
    setError("");
    try {
      await editUser(token, newProfile.username, newProfile.role);
      const res = await getUsers(token);
      setProfiles(res.data);
      setEditing(null);
      setNewProfile({ username: "", password: "", role: "GUEST" });
    } catch (err) {
      if (err.status === 401 && onAuthError) {
        onAuthError("Sessão expirada ou token inválido. Faça login novamente.");
      }
      setError("Erro ao editar perfil: " + (err.message || ""));
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!canEdit) return;
    if (!window.confirm("Tem certeza que deseja excluir este perfil?")) return;
    setLoading(true);
    setError("");
    try {
      await deleteUser(token, id);
      const res = await getUsers(token);
      setProfiles(res.data);
    } catch (err) {
      if (err.status === 401 && onAuthError) {
        onAuthError("Sessão expirada ou token inválido. Faça login novamente.");
      }
      setError("Erro ao excluir perfil: " + (err.message || ""));
    }
    setLoading(false);
  };

  // Função para alterar senha
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    // Permite EMPREGADO/GUEST alterar a própria senha
    if (!canEdit && passwordChange.username !== user?.username) return;
    setLoading(true);
    setError("");
    try {
      await changeUserPassword(token, passwordChange.username, passwordChange.newPassword);
      setShowPasswordChange(false);
      setPasswordChange({ username: '', newPassword: '' });
      setError("");
    } catch (err) {
      if (err.status === 401 && onAuthError) {
        onAuthError("Sessão expirada ou token inválido. Faça login novamente.");
      }
      setError("Erro ao alterar senha: " + (err.message || ""));
    }
    setLoading(false);
  };



  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%)',
      color: '#fff',
      fontFamily: "Orbitron, 'Segoe UI', Arial, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 0'
    }}>
      <div style={{
        background: 'rgba(26,26,46,0.98)',
        borderRadius: 18,
        border: '2.5px solid #00eaff',
        boxShadow: '0 0 32px #00eaff55',
        padding: 36,
        maxWidth: 700,
        width: '100%',
        marginBottom: 32,
      }}>
        <h1 style={{ color: '#00eaff', fontWeight: 700, marginBottom: 18 }}>Gerenciar Perfis</h1>
        {canEdit && (
          <button className="add-resource-btn" style={{
            background: '#00C851',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 18,
            boxShadow: '0 2px 8px #00C85155',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.target.style.background = '#00a844'}
          onMouseLeave={e => e.target.style.background = '#00C851'}
          onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancelar" : "Novo Perfil"}
          </button>
        )}
        {showAdd && canEdit && (
          <div style={{
            background: 'rgba(26,26,46,0.98)',
            borderRadius: 14,
            border: '2px solid #00eaff',
            boxShadow: '0 0 16px #00eaff33',
            padding: 24,
            marginBottom: 24,
          }}>
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Usuário"
                value={newProfile.username}
                onChange={e => setNewProfile({ ...newProfile, username: e.target.value })}
                required
                style={{ padding: 12, borderRadius: 8, border: '2px solid #00eaff', background: '#1a1a2e', color: '#fff', fontSize: 16, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#00eaff'}
                onBlur={e => e.target.style.borderColor = '#00eaff'}
              />
              <input
                type="password"
                placeholder="Senha"
                value={newProfile.password}
                onChange={e => setNewProfile({ ...newProfile, password: e.target.value })}
                required
                style={{ padding: 12, borderRadius: 8, border: '2px solid #00eaff', background: '#1a1a2e', color: '#fff', fontSize: 16, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#00eaff'}
                onBlur={e => e.target.style.borderColor = '#00eaff'}
              />
              <select
                value={newProfile.role}
                onChange={e => setNewProfile({ ...newProfile, role: e.target.value })}
                style={{ padding: 12, borderRadius: 8, border: '2px solid #00eaff', background: '#1a1a2e', color: '#fff', fontSize: 16, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#00eaff'}
                onBlur={e => e.target.style.borderColor = '#00eaff'}
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button type="submit" className="add-resource-btn" style={{
                background: '#00C851',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 'bold',
                boxShadow: '0 2px 8px #00C85155',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.target.style.background = '#00a844'}
              onMouseLeave={e => e.target.style.background = '#00C851'}>Criar</button>
            </form>
          </div>
        )}
        {error && <div className="cyber-error-toast">{error}</div>}
        {loading ? (
          <div style={{ color: '#00eaff', fontWeight: 700 }}>Carregando perfis...</div>
        ) : (
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>

            {canEdit && Array.isArray(profiles) && profiles.length > 0 && profiles.map((profile, idx) => (
              <div key={profile.username || profile.id || idx} style={{
                background: 'rgba(26,26,46,0.98)',
                borderRadius: 14,
                border: '2px solid #00eaff',
                boxShadow: '0 0 16px #00eaff33',
                padding: 24,
                marginBottom: 18,
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}>
                <div>
                  <h3 style={{ color: '#00eaff', fontSize: 24, fontWeight: 700 }}>{profile.username}</h3>
                  <p><strong>Função:</strong> <span style={{ color: '#ff0055', fontSize: 18 }}>{formatRole(profile.role)}</span></p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{
                    background: '#00C851',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px #00C85155',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = '#00a844'}
                  onMouseLeave={e => e.target.style.background = '#00C851'}
                  onClick={() => handleEdit(profile.username)}>Editar</button>
                  <button style={{
                    background: '#ff4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px #ff4444aa',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = '#cc3333'}
                  onMouseLeave={e => e.target.style.background = '#ff4444'}
                  onClick={() => handleDelete(profile.username)}>Excluir</button>
                  <button style={{
                    background: '#00eaff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px #00eaff55',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = '#0099cc'}
                  onMouseLeave={e => e.target.style.background = '#00eaff'}
                  onClick={() => {
                    setShowPasswordChange(true);
                    setPasswordChange({ username: profile.username, newPassword: '' });
                  }}>Alterar Senha</button>
                </div>
                {showPasswordChange && passwordChange.username === profile.username && (
                  <form onSubmit={handlePasswordChange} style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
                    <input
                      type="password"
                      placeholder="Nova Senha"
                      value={passwordChange.newPassword}
                      onChange={e => setPasswordChange({ ...passwordChange, newPassword: e.target.value })}
                      required
                      style={{ padding: 12, borderRadius: 8, border: '2px solid #00eaff', background: '#1a1a2e', color: '#fff', fontSize: 16, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#00eaff'}
                      onBlur={e => e.target.style.borderColor = '#00eaff'}
                    />
                    <button type="submit" style={{
                      background: '#00C851',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 18px',
                      fontSize: 16,
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px #00C85155',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.background = '#00a844'}
                    onMouseLeave={e => e.target.style.background = '#00C851'}>Salvar Senha</button>
                    <button type="button" style={{
                      background: '#ff4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 18px',
                      fontSize: 16,
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px #ff4444aa',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.background = '#cc3333'}
                    onMouseLeave={e => e.target.style.background = '#ff4444'}
                    onClick={() => setShowPasswordChange(false)}>Cancelar</button>
                  </form>
                )}
              </div>
            ))}

            {!canEdit && (
              <div style={{
                background: 'rgba(26,26,46,0.98)',
                borderRadius: 14,
                border: '2px solid #00eaff',
                boxShadow: '0 0 16px #00eaff33',
                padding: 24,
                marginBottom: 18,
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}>
                <div>
                  <h3 style={{ color: '#00eaff', fontSize: 24, fontWeight: 700 }}>{user?.username}</h3>
                  <p><strong>Função:</strong> <span style={{ color: '#ff0055', fontSize: 18 }}>{formatRole(user?.role)}</span></p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{
                    background: '#00eaff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 16,
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px #00eaff55',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = '#0099cc'}
                  onMouseLeave={e => e.target.style.background = '#00eaff'}
                  onClick={() => {
                    setShowPasswordChange(true);
                    setPasswordChange({ username: user?.username, newPassword: '' });
                  }}>Alterar Senha</button>
                </div>
                {showPasswordChange && passwordChange.username === user?.username && (
                  <form onSubmit={handlePasswordChange} style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
                    <input
                      type="password"
                      placeholder="Nova Senha"
                      value={passwordChange.newPassword}
                      onChange={e => setPasswordChange({ ...passwordChange, newPassword: e.target.value })}
                      required
                      style={{ padding: 12, borderRadius: 8, border: '2px solid #00eaff', background: '#1a1a2e', color: '#fff', fontSize: 16, outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#00eaff'}
                      onBlur={e => e.target.style.borderColor = '#00eaff'}
                    />
                    <button type="submit" style={{
                      background: '#00C851',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 18px',
                      fontSize: 16,
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px #00C85155',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.background = '#00a844'}
                    onMouseLeave={e => e.target.style.background = '#00C851'}>Salvar Senha</button>
                    <button type="button" style={{
                      background: '#ff4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 18px',
                      fontSize: 16,
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px #ff4444aa',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.background = '#cc3333'}
                    onMouseLeave={e => e.target.style.background = '#ff4444'}
                    onClick={() => setShowPasswordChange(false)}>Cancelar</button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileManager;
