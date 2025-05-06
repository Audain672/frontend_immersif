import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { useEffect } from "react";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";

function App() {
  console.log("Initialisation de l'application");
  
  useEffect(() => {
    console.log("Application montée");
    
    // Vérifier la disponibilité de Three.js
    if (window.THREE) {
      console.log("Three.js disponible:", window.THREE.REVISION);
    } else {
      console.error("❌ Three.js non disponible");
    }
    
    // Vérifier la présence des fichiers requis
    const checkFile = async (path) => {
      try {
        const response = await fetch(path, { method: 'HEAD' });
        return response.ok;
      } catch (error) {
        return false;
      }
    };
    
    const checkFiles = async () => {
      const textureExists = await checkFile('/texture/env.jpg');
      console.log("Texture fond d'écran existe:", textureExists ? "✅" : "❌");
      
      const modelExists = await checkFile('/models/64f1a714fe61576b46f27ca2.glb');
      console.log("Modèle Avatar existe:", modelExists ? "✅" : "❌");
      
      const animationsExist = await checkFile('/models/animations.glb');
      console.log("Animations existent:", animationsExist ? "✅" : "❌");
    };
    
    checkFiles();
    
    return () => {
      console.log("Application démontée");
    };
  }, []);
  
  return (
    <>
      <Loader 
        dataInterpolation={(p) => `Chargement: ${p.toFixed(2)}%`}
        initialState={(active) => console.log("Loader initial state:", active)}
        onStart={() => console.log("Chargement démarré")} 
        onFinish={() => console.log("Chargement terminé")}
      />
      <Leva hidden />
      <UI />
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 1], fov: 30 }}
        onCreated={(state) => {
          console.log("Canvas créé:", state);
        }}
        onError={(error) => {
          console.error("❌ Erreur Canvas:", error);
        }}
      >
        <Experience />
      </Canvas>
    </>
  );
}

export default App;