import React, { useEffect } from "react";
import batmanBeyond from "../assets/batman-beyond.png";
import analystSymbol from "../assets/analyst-symbol.png";
import guestIcon from "../assets/guest-icon.png";

export default function LoginAnimation({ onFinish, role, username }) {
  let imageSrc, backgroundColor, text, textStyle, animationClass, duration, imgStyle;

  switch ((role || "").toUpperCase()) {
    case "ADMIN":
      imageSrc = batmanBeyond;
      backgroundColor = "#1a0000";
      text = `BEM-VINDO, ADMINISTRADOR${username ? `: ${username}` : ''}`;
      textStyle = { color: "#ff1a1a", textShadow: "0 0 12px #f00", fontWeight: "bold" };
      animationClass = "admin-anim";
      duration = 2500;
      imgStyle = { width: 320, height: 220, filter: "drop-shadow(0 0 32px #ff1a1a)" };
      break;
    case "GERENTE":
      imageSrc = analystSymbol;
      backgroundColor = "#001a33";
      text = `BEM-VINDO, GERENTE${username ? `: ${username}` : ''}`;
      textStyle = { color: "#00bfff", textShadow: "0 0 10px #0bf" };
      animationClass = "manager-anim";
      duration = 1800;
      imgStyle = { width: 220, height: 180, filter: "drop-shadow(0 0 24px #00bfff)" };
      break;
    default:
      imageSrc = guestIcon;
      backgroundColor = "#111";
      text = `BEM-VINDO AO WAYNE SECURE SYSTEM${username ? `, ${username}` : ''}`;
      textStyle = { color: "#ccc", textShadow: "0 0 6px #888" };
      animationClass = "guest-anim";
      duration = 1200;
      imgStyle = { width: 180, height: 120, filter: "drop-shadow(0 0 12px #fff)" };
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, duration);
    return () => clearTimeout(timer);
  }, [onFinish, duration]);

  return (
    <div className={`login-animation-bg ${animationClass}`} style={{
      backgroundColor,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <img src={imageSrc} alt="Símbolo" style={imgStyle} />
      <h2 className="glow-text" style={{ marginTop: 40, fontSize: 28, ...textStyle }}>
        {text}
      </h2>
    </div>
  );
}