import React from "react";

function SimpleApp() {
  return (
    <div style={{
      backgroundColor: "#000",
      color: "#00eaff",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Arial, sans-serif",
      textAlign: "center"
    }}>
      <div>
        <h1 style={{ color: "#ff0059", fontSize: "3rem", marginBottom: "20px" }}>
          🛡️ WAYNE SECURE SYSTEM
        </h1>
        <p style={{ fontSize: "1.5rem", marginBottom: "30px" }}>
          Sistema Funcionando Perfeitamente
        </p>
        <div style={{ 
          background: "#18191a", 
          padding: "20px", 
          borderRadius: "10px",
          border: "2px solid #00eaff",
          maxWidth: "400px"
        }}>
          <h3 style={{ color: "#00eaff", marginBottom: "15px" }}>Status do Sistema</h3>
          <p>✅ React carregado</p>
          <p>✅ CSS aplicado</p>
          <p>✅ Componentes funcionais</p>
          <p style={{ marginTop: "20px", fontSize: "0.9rem", color: "#888" }}>
            {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SimpleApp;
