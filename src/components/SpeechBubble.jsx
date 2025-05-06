// components/SpeechBubble.jsx
import React from "react";
import { useChat } from "../hooks/useChat";
import { Html } from "@react-three/drei";

const SpeechBubble = () => {
  const { message } = useChat();

  if (!message) return null;

  return (
    <Html position={[0, 1.80, 0]} center distanceFactor={5}>
      <div
        style={{
          position: "relative",
          background: "rgba(255, 255, 255, 0.9)",
          padding: "3px 6px",
          borderRadius: "4px",
          border: "1px solid #ddd",
          minWidth: "40px",
          width: "80px",
          maxWidth: "80px",
          fontSize: "0.4rem",
          color: "#333",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
          lineHeight: "1.1",
          whiteSpace: "normal",
          writingMode: "horizontal-tb",
          direction: "ltr",
        }}
      >
        {message.text}
      </div>
    </Html>
  );
};

export default SpeechBubble;
