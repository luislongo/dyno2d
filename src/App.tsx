import { useEffect, useRef } from "react";
import * as Three from "three";
import "./App.css";

function App() {
  const renderer = new Three.WebGLRenderer();
  const scene = new Three.Scene();
  const camera = new Three.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    canvasRef.current?.appendChild(renderer.domElement);

    camera.position.z = 5;
    const geometry = new Three.BoxGeometry(1, 1, 1);
    const material = new Three.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Three.Mesh(geometry, material);
    scene.add(cube);

    return () => {
      canvasRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  setInterval(() => {
    renderer.render(scene, camera);
  }, 1000 / 60);

  return <div className="canvas" ref={canvasRef}></div>;
}

export default App;
