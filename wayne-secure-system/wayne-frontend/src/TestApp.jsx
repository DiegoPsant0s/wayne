import React from 'react';

function TestApp() {
  return (
    <div style={{
      backgroundColor: '#000',
      color: '#00eaff',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#ff0059', marginBottom: '20px' }}>
          🛡️ Wayne Secure System
        </h1>
        <p>Sistema carregado com sucesso!</p>
        <p style={{ fontSize: '16px', color: '#888' }}>
          Data: {new Date().toLocaleString('pt-BR')}
        </p>
        <button
          onClick={() => alert('React está funcionando!')}
          style={{
            background: '#00eaff',
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Testar Clique
        </button>
      </div>
    </div>
  );
}

export default TestApp;
