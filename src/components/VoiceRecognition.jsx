// src/components/VoiceRecognition.jsx
import { useState, useEffect, useCallback } from "react";

export const VoiceRecognition = ({ onResult, onStatusChange, language = 'fr-FR' }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState("");
  
  // Initialiser la reconnaissance vocale
  useEffect(() => {
    // Vérifier si l'API est supportée
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }
    
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.lang = language;
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.maxAlternatives = 1;
    
    // Configurer les événements
    recognitionInstance.onstart = () => {
      setIsListening(true);
      if (onStatusChange) onStatusChange('listening');
    };
    
    recognitionInstance.onend = () => {
      setIsListening(false);
      if (onStatusChange) onStatusChange('stopped');
    };
    
    recognitionInstance.onerror = (event) => {
      setError(`Erreur de reconnaissance vocale: ${event.error}`);
      setIsListening(false);
      if (onStatusChange) onStatusChange('error', event.error);
    };
    
    recognitionInstance.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.trim();
      
      if (lastResult.isFinal && onResult) {
        onResult(transcript);
      }
      
      if (onStatusChange && !lastResult.isFinal) {
        onStatusChange('processing', transcript);
      }
    };
    
    setRecognition(recognitionInstance);
    
    // Nettoyer l'instance lors du démontage
    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (e) {
          // Ignorer les erreurs de stop (peut se produire si pas démarré)
        }
      }
    };
  }, [language, onResult, onStatusChange]);
  
  // Fonction pour démarrer l'écoute
  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        setError("");
        return true;
      } catch (e) {
        setError(`Erreur lors du démarrage: ${e.message}`);
        return false;
      }
    }
    return false;
  }, [recognition, isListening]);
  
  // Fonction pour arrêter l'écoute
  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      try {
        recognition.stop();
        return true;
      } catch (e) {
        setError(`Erreur lors de l'arrêt: ${e.message}`);
        return false;
      }
    }
    return false;
  }, [recognition, isListening]);
  
  return {
    startListening,
    stopListening,
    isListening,
    error,
    supported: !!recognition
  };
};

export default VoiceRecognition;