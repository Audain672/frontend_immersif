import { createContext, useContext, useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_API_URL || "https://backend-immersif.onrender.com";
console.log("URL du backend:", backendUrl);

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const chat = async (message) => {
    console.log("Envoi de message au backend:", message);
    setLoading(true);
    try {
      const data = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      const resp = (await data.json()).messages;
      console.log("Réponse reçue du backend:", resp);
      setMessages((messages) => [...messages, ...resp]);
    } catch (error) {
      console.error("❌ Erreur lors de la communication avec le backend:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  // Changez l'état initial à false pour éviter le zoom automatique au chargement
  const [cameraZoomed, setCameraZoomed] = useState(false);
  console.log("État initial de cameraZoomed:", cameraZoomed);
  
  const onMessagePlayed = () => {
    console.log("Message joué, suppression de la file");
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    console.log("Messages mis à jour:", messages.length);
    if (messages.length > 0) {
      console.log("Définition du message actuel:", messages[0]);
      setMessage(messages[0]);
    } else {
      console.log("Pas de messages, message actuel défini à null");
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    console.error("❌ useChat doit être utilisé à l'intérieur d'un ChatProvider");
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
