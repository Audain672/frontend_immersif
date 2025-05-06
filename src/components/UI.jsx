import { useRef, useState, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { VoiceRecognition } from "./VoiceRecognition";

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const { chat, loading, cameraZoomed, setCameraZoomed, message } = useChat();
  const [showVitalSigns, setShowVitalSigns] = useState(false);
  const [activeSign, setActiveSign] = useState(null);
  
  // États pour la reconnaissance vocale
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  
  // État pour les instruments médicaux et leurs positions
  const [instruments, setInstruments] = useState([
    { id: 'thermometer', name: 'Thermomètre', type: 'temperature', position: { x: 0, y: 0 }, active: false, measuring: false, value: '37.2°C', color: 'text-red-500', icon: '🌡️' },
    { id: 'heartmonitor', name: 'Cardioscope', type: 'heartrate', position: { x: 0, y: 0 }, active: false, measuring: false, value: '72 bpm', color: 'text-pink-500', icon: '❤️' },
    { id: 'bloodpressure', name: 'Tensiomètre', type: 'bloodpressure', position: { x: 0, y: 0 }, active: false, measuring: false, value: '120/80 mmHg', color: 'text-purple-500', icon: '📊' },
    { id: 'respirator', name: 'Moniteur respiratoire', type: 'respiratory', position: { x: 0, y: 0 }, active: false, measuring: false, value: '16 resp/min', color: 'text-blue-500', icon: '🫁' },
    { id: 'oximeter', name: 'Oxymètre', type: 'oxygen', position: { x: 0, y: 0 }, active: false, measuring: false, value: '98%', color: 'text-cyan-500', icon: '💧' }
  ]);
  
  // Initialisation de la reconnaissance vocale
  const { startListening, stopListening, isListening, error, supported } = VoiceRecognition({
    onResult: (transcript) => {
      // Quand un résultat final est disponible
      if (transcript && transcript.length > 0) {
        // Mettre le texte reconnu dans l'input
        if (input.current) {
          input.current.value = transcript;
        }
        
        // Option: envoyer automatiquement le message
        if (!loading && !message) {
          chat(transcript);
          if (input.current) input.current.value = "";
        }
      }
      setInterimTranscript('');
      setVoiceStatus('completed');
    },
    onStatusChange: (status, text) => {
      setVoiceStatus(status);
      if (status === 'processing' && text) {
        setInterimTranscript(text);
      } else if (status !== 'processing') {
        setInterimTranscript('');
      }
    },
    language: 'fr-FR' // Langue préférée pour la reconnaissance
  });
  
  // État pour les signes vitaux mesurés
  const [measuredSigns, setMeasuredSigns] = useState({});
  
  // État pour le drag and drop
  const [draggedInstrument, setDraggedInstrument] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Positions initiales des instruments
  useEffect(() => {
    const setInitialPositions = () => {
      const containerLeft = 80; // Position fixe depuis la gauche
      const containerTop = 140; // Position fixe depuis le haut
      
      setInstruments(instruments.map((instrument, index) => ({
        ...instrument,
        position: {
          x: containerLeft,
          y: containerTop + index * 70
        },
        initialPosition: {
          x: containerLeft,
          y: containerTop + index * 70
        }
      })));
    };
    
    setInitialPositions();
    
    // Réinitialiser les positions si la fenêtre est redimensionnée
    window.addEventListener('resize', setInitialPositions);
    return () => window.removeEventListener('resize', setInitialPositions);
  }, [showVitalSigns]);
  
  // Gestion du début du glisser-déposer
  const handleMouseDown = (e, instrumentId) => {
    e.preventDefault();
    const instrument = instruments.find(i => i.id === instrumentId);
    if (instrument && !instrument.measuring) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setDraggedInstrument(instrumentId);
      
      // Mettre à jour l'état pour montrer que l'instrument est actif
      setInstruments(instruments.map(i => 
        i.id === instrumentId 
          ? { ...i, active: true } 
          : i
      ));
      
      // Ajouter des écouteurs d'événements pour le mouvement et la fin du glisser-déposer
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };
  
  // Gestion du mouvement pendant le glisser-déposer
  const handleMouseMove = (e) => {
    if (draggedInstrument) {
      setInstruments(instruments.map(instrument => 
        instrument.id === draggedInstrument 
          ? { 
              ...instrument, 
              position: { 
                x: e.clientX - dragOffset.x, 
                y: e.clientY - dragOffset.y 
              } 
            } 
          : instrument
      ));
    }
  };
  
  // Gestion de la fin du glisser-déposer
  const handleMouseUp = (e) => {
    if (draggedInstrument) {
      const instrument = instruments.find(i => i.id === draggedInstrument);
      
      // Vérifier si l'instrument est suffisamment proche de l'avatar (centre de l'écran)
      const avatarPosition = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      };
      
      const distance = Math.sqrt(
        Math.pow(instrument.position.x - avatarPosition.x, 2) +
        Math.pow(instrument.position.y - avatarPosition.y, 2)
      );
      
      console.log("Distance to avatar:", distance);
      
      // Augmenter la zone de détection pour plus de facilité
      if (distance < 300) { // Zone de détection plus large
        console.log("Measuring with:", instrument.id);
        
        // Mettre à jour uniquement l'instrument en cours de mesure
        setInstruments(prev => prev.map(i => 
          i.id === draggedInstrument 
            ? { ...i, measuring: true, active: false } 
            : i
        ));
        
        // Simuler le temps de mesure
        setTimeout(() => {
          // Enregistrer la mesure
          setMeasuredSigns(prev => ({
            ...prev,
            [instrument.type]: instrument.value
          }));
          
          // Réinitialiser l'instrument
          setInstruments(prev => prev.map(i => 
            i.id === draggedInstrument 
              ? { 
                  ...i, 
                  measuring: false, 
                  position: i.initialPosition,
                  active: false
                } 
              : i
          ));
          
          console.log("Measurement completed:", instrument.type, instrument.value);
        }, 2000); // Temps de mesure: 2 secondes
      } else {
        // Si l'instrument n'est pas près de l'avatar, le ramener à sa position initiale
        setInstruments(prev => prev.map(i => 
          i.id === draggedInstrument 
            ? { 
                ...i, 
                position: i.initialPosition,
                active: false 
              } 
            : i
        ));
      }
      
      setDraggedInstrument(null);
      
      // Retirer les écouteurs d'événements
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  };
  
  const sendMessage = () => {
    const text = input.current.value;
    if (!loading && !message) {
      chat(text);
      input.current.value = "";
    }
  };

  // Fonction pour afficher les détails des signes vitaux
  const showVitalDetails = (sign) => {
    setActiveSign(sign);
  };

  // Gestionnaire pour le bouton de reconnaissance vocale
  const handleVoiceButtonClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (hidden) {
    return null;
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
        <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg">
          <h1 className="font-black text-xl">Mon Patient</h1>
          <p>Je prendrai soin de toi 🏥</p>
        </div>

        {/* Bouton pour afficher/masquer le panneau des signes vitaux */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowVitalSigns(!showVitalSigns)}
            className="pointer-events-auto bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-md flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75z"
              />
            </svg>
            Signes vitaux
          </button>
        </div>

        {/* Instruments médicaux déplaçables */}
        {showVitalSigns && instruments.map((instrument) => (
          <div
            key={instrument.id}
            className={`pointer-events-auto absolute p-3 rounded-lg shadow-lg ${
              instrument.active ? 'bg-blue-100 border-2 border-blue-500 z-50' : 
              instrument.measuring ? 'bg-yellow-100 border-2 border-yellow-500 z-40' : 
              'bg-white bg-opacity-80 backdrop-blur-md z-30'
            } cursor-grab`}
            style={{
              left: instrument.position.x,
              top: instrument.position.y,
              width: "100px",
              transform: 'translate(-50%, -50%)',
              transition: draggedInstrument === instrument.id ? 'none' : 'all 0.5s ease'
            }}
            onMouseDown={(e) => handleMouseDown(e, instrument.id)}
          >
            <div className="flex flex-col items-center">
              <div className={`text-2xl ${instrument.color}`}>{instrument.icon}</div>
              <div className="text-xs font-semibold mt-1">{instrument.name}</div>
              {instrument.measuring && (
                <div className="mt-1 text-xs text-yellow-700 animate-pulse">
                  Mesure en cours...
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Instructions d'utilisation */}
        {showVitalSigns && (
          <div className="absolute top-20 right-4 pointer-events-auto bg-white bg-opacity-80 backdrop-blur-md p-4 rounded-lg shadow-lg w-80">
            <h2 className="font-bold text-lg mb-2 text-blue-700">Comment utiliser</h2>
            <p className="text-sm text-gray-700 mb-3">
              Faites glisser les instruments médicaux vers le patient pour mesurer ses signes vitaux.
            </p>
            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span className="text-xs">Les résultats s'afficheront une fois la mesure terminée.</span>
            </div>
          </div>
        )}
        
        {/* Résultats des mesures */}
        {Object.keys(measuredSigns).length > 0 && (
          <div className="absolute top-20 right-4 mt-48 pointer-events-auto bg-white bg-opacity-80 backdrop-blur-md p-4 rounded-lg shadow-lg w-80">
            <h2 className="font-bold text-lg mb-3 text-blue-700">Signes vitaux mesurés</h2>
            <div className="flex flex-col gap-2">
              {Object.entries(measuredSigns).map(([type, value]) => {
                const instrument = instruments.find(i => i.type === type);
                return (
                  <div key={type} className="flex items-center gap-2 p-2 rounded-md bg-blue-50">
                    <span className={`text-xl ${instrument.color}`}>{instrument.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-700">{instrument.name}</p>
                      <p className="text-lg font-bold">{value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={() => setMeasuredSigns({})}
              className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm"
            >
              Effacer les mesures
            </button>
          </div>
        )}

        {/* Affichage des signes vitaux mesurés au-dessus de l'avatar */}
        {Object.keys(measuredSigns).length > 0 && (
          <div className="fixed top-28 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
            <div className="bg-white bg-opacity-70 backdrop-blur-sm p-3 rounded-lg shadow-lg flex flex-col gap-1 text-sm">
              {Object.entries(measuredSigns).map(([type, value]) => {
                const instrument = instruments.find(i => i.type === type);
                return (
                  <div key={type} className="flex items-center gap-2">
                    <span className={`text-xl ${instrument.color}`}>{instrument.icon}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="w-full flex flex-col items-end justify-center gap-4">
          {/*<button
            onClick={() => setCameraZoomed(!cameraZoomed)}
            className="pointer-events-auto bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-md"
          >
            cameraZoomed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                />
              </svg>
            )
          </button>*/}
          {/*<button
            onClick={() => {
              const body = document.querySelector("body");
              if (body.classList.contains("greenScreen")) {
                body.classList.remove("greenScreen");
              } else {
                body.classList.add("greenScreen");
              }
            }}
            className="pointer-events-auto bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </button>
          */}
        </div>
        <div className="flex items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
          <div className="relative w-full">
            <input
              className="w-full placeholder:text-gray-800 placeholder:italic p-4 pr-12 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
              placeholder={isListening ? "Parlez maintenant..." : "Écrivez ou parlez..."}
              ref={input}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />
            
            {/* Indicateur de statut vocal (transcription temporaire) */}
            {interimTranscript && (
              <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white bg-opacity-80 backdrop-blur-sm rounded-md text-sm text-gray-700 animate-pulse">
                {interimTranscript}
              </div>
            )}
            
            {/* Bouton microphone intégré à l'input */}
            {supported && (
              <button
                onClick={handleVoiceButtonClick}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full 
                  ${isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                title={isListening ? "Arrêter l'écoute" : "Parler"}
              >
                {isListening ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            )}
          </div>
          
          <button
            disabled={loading || message}
            onClick={sendMessage}
            className={`bg-pink-500 hover:bg-pink-600 text-white p-4 px-10 font-semibold uppercase rounded-md ${
              loading || message ? "cursor-not-allowed opacity-30" : ""
            }`}
          >
            Send
          </button>
        </div>
        
        {/* Message d'erreur vocal si applicable */}
        {error && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md">
            {error}
          </div>
        )}
      </div>
    </>
  );
};