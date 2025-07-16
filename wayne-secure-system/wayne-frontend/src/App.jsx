import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard_Simple';
import Navbar from './components/Navbar';
import ResourceManager from './components/ResourceManager';
import ProfileManager from './components/ProfileManager';
import AlertsPage from './components/AlertsPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    // Verificar se há dados de login salvos
    const savedUser = localStorage.getItem('wayneUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (userData) => {
    console.log('Login realizado:', userData);
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('wayneUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setCurrentView('dashboard');
    localStorage.removeItem('wayneUser');
  };

  // Mensagem global de erro de autenticação
  const [authError, setAuthError] = useState("");

  // Intercepta erros 401 vindos dos componentes
  const handleAuthError = (msg) => {
    setAuthError(msg || "Sessão expirada ou token inválido. Faça login novamente.");
    handleLogout();
  };
  const renderMainContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user} onAuthError={handleAuthError} />;
      case 'resources':
        // Passa token e role para o ResourceManager completo
        return <ResourceManager token={user?.token} userRole={user?.role?.toLowerCase()} onAuthError={handleAuthError} />;
      case 'profiles':
        return <ProfileManager user={user} onAuthError={handleAuthError} />;
      case 'alerts':
        return <AlertsPage user={user} onAuthError={handleAuthError} darkMode={false} />;
      default:
        return <Dashboard user={user} onAuthError={handleAuthError} />;
    }
  };



  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Navbar 
        user={user} 
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
      />
      {authError && (
        <div style={{ background: '#ff0055', color: '#fff', padding: '12px', textAlign: 'center', fontWeight: 'bold', boxShadow: '0 0 8px #ff0055', marginBottom: 8 }}>
          {authError}
        </div>
      )}
      <main className="main-content">
        {user ? renderMainContent() : <div>Usuário não encontrado. Faça login novamente.</div>}
      </main>
    </div>
  );
}

export default App;