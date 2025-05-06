import {
  CameraControls,
  ContactShadows,
  useTexture,
} from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";
import SpeechBubble from "./SpeechBubble";

// Composant pour le fond d'écran
const Background = () => {
  // Charger la texture
  const texture = useTexture("/texture/env.jpg");
  
  return (
    <mesh position={[0, 0, -10]}>
      <planeGeometry args={[20, 15]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
};

export const Experience = () => {
  const cameraControls = useRef();
  const { cameraZoomed } = useChat();

  useEffect(() => {
    if (cameraControls.current) {
      cameraControls.current.setLookAt(0, 2, 5, 0, 1.5, 0);
    }
  }, []);

  useEffect(() => {
    if (cameraControls.current) {
      if (cameraZoomed) {
        cameraControls.current.setLookAt(0, 1.5, 1.5, 0, 1.5, 0, true);
      } else {
        cameraControls.current.setLookAt(0, 1.5, 1.5, 0, 1.5, 0, true);
      }
    }
  }, [cameraZoomed]);
  
  return (
    <>
      <CameraControls ref={cameraControls} dollySpeed={0} truck={false} azimuthRotateSpeed={false} polarRotateSpeed={false} />
      
      {/* Lumières pour l'éclairage de l'avatar */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#ffaa00" />
      
      {/* Fond d'écran avec image */}
      <Suspense fallback={<color attach="background" args={["#e0f7ff"]} />}>
        <Background />
      </Suspense>
      
      {/* Avatar et ombres */}
      <Suspense fallback={null}>
        <Avatar />
        <ContactShadows opacity={0.7} />
        <SpeechBubble />
      </Suspense>
    </>
  );
};