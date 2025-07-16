import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import guestIconImg from '../assets/guest-icon.png';
import LoginAnimation from './LoginAnimation';
import api from '../services/api';
import '../styles/cyberpunk.css';

const LoginForm = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      const response = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const responseUser = response.data.data || response.data.user;
      if (response.data.success && responseUser) {
        setUserData({
          username: responseUser.username || responseUser.sub,
          role: responseUser.role,
          token: responseUser.access_token
        });
        setShowAnimation(true);
      } else {
        setError(response.data.message || 'Erro no login');
      }
    } catch (error) {
      console.error('Erro de login:', error);
      // Fallback para usuários de demonstração (funciona, mas não é exibido na tela)
      if (username === 'admin' && password === 'admin123') {
        const demoUser = {
          id: 1,
          username: 'admin',
          role: 'ADMIN',
          token: 'demo-token-' + Date.now()
        };
        setUserData(demoUser);
        setShowAnimation(true);
      } else if (username === 'gerente' && password === 'gerente123') {
        const demoUser = {
          id: 2,
          username: 'gerente',
          role: 'GERENTE',
          token: 'demo-token-' + Date.now()
        };
        setUserData(demoUser);
        setShowAnimation(true);
      } else if (username === 'guest' && password === 'guest123') {
        const demoUser = {
          id: 3,
          username: 'guest',
          role: 'GUEST',
          token: 'demo-token-' + Date.now()
        };
        setUserData(demoUser);
        setShowAnimation(true);
      } else {
        setError('Usuário ou senha inválidos');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (showAnimation && userData) {
    return (
      <LoginAnimation
        role={userData.role}
        username={userData.username}
        onFinish={() => {
          console.log('Finalizando animação, usuário:', userData);
          setShowAnimation(false);
          onLogin(userData);
        }}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f23 100%)',
    }}>
      <div style={{
        background: 'rgba(26,26,46,0.95)',
        borderRadius: 18,
        border: '2.5px solid #00eaff',
        boxShadow: '0 0 32px #00eaff55',
        padding: 40,
        minWidth: 340,
        maxWidth: 400,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}>
        <img src={guestIconImg} alt="Guest Icon" style={{ width: '110px', marginBottom: '8px', marginTop: '-32px', filter: 'drop-shadow(0 0 24px #00eaff)' }} />
        <h1 style={{ color: '#00eaff', textAlign: 'center', marginBottom: 6, fontWeight: 700, fontSize: 28, letterSpacing: 1 }}>Wayne Secure System</h1>
        <p style={{ color: '#fff', textAlign: 'center', marginBottom: 24, fontSize: 16, opacity: 0.8 }}>Sistema de Segurança Corporativa</p>
        <form onSubmit={handleSubmit} style={{ width: '100%', margin: '0 auto' }} aria-label="Formulário de login">
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="username" style={{ color: '#00eaff', fontWeight: 500, marginBottom: 6, display: 'block' }}>Usuário</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              required
              aria-required="true"
              aria-label="Usuário"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '2px solid #333',
                background: '#1a1a2e',
                color: '#fff',
                fontSize: 16,
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#00eaff'}
              onBlur={e => e.target.style.borderColor = '#333'}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="password" style={{ color: '#00eaff', fontWeight: 500, marginBottom: 6, display: 'block' }}>Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
              aria-required="true"
              aria-label="Senha"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '2px solid #333',
                background: '#1a1a2e',
                color: '#fff',
                fontSize: 16,
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#00eaff'}
              onBlur={e => e.target.style.borderColor = '#333'}
            />
          </div>
          {error && (
            <div style={{
              background: '#ff0055',
              color: '#fff',
              borderRadius: 10,
              padding: '14px 20px',
              marginBottom: 16,
              fontWeight: 'bold',
              fontSize: 16,
              boxShadow: '0 0 16px #ff0055',
              textAlign: 'center',
              border: '2px solid #fff',
              letterSpacing: 1,
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              background: '#00C851',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '14px 0',
              cursor: 'pointer',
              fontSize: 18,
              fontWeight: 'bold',
              width: '100%',
              marginTop: 8,
              marginBottom: 18,
              boxShadow: '0 2px 8px #00C85155',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = '#00a844'}
            onMouseLeave={e => e.target.style.background = '#00C851'}
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  );
}

export default LoginForm;
