import { useEffect, useRef } from "react";
import * as Three from "three";
import "./App.css";
import mockStr from "./algebra/mockStr.json";
import { Structure } from "./parser/Parser";

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
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 5;

    const { joints, edges, restrictions } = mockStr as Structure;
    // Draw joints
    Object.values(joints).forEach((joint) => {
      const geometry = new Three.SphereGeometry(0.1, 32, 32);
      const material = new Three.MeshBasicMaterial({ color: 0xffff00 });
      const sphere = new Three.Mesh(geometry, material);
      sphere.position.set(joint.position.x, joint.position.y, 0);
      scene.add(sphere);
    });

    // Draw edges
    edges.forEach((edge) => {
      console.log("Start joint position", joints[edge.start]);
      console.log("End joint position", joints[edge.end]);
      const length = Math.sqrt(
        Math.pow(
          joints[edge.start].position.x - joints[edge.end].position.x,
          2
        ) +
          Math.pow(
            joints[edge.start].position.y - joints[edge.end].position.y,
            2
          )
      );
      const geometry = new Three.BoxGeometry(length, 0.1, 0.1);
      const material = new Three.MeshBasicMaterial({ color: 0x00ff00 });

      const cube = new Three.Mesh(geometry, material);
      cube.position.set(
        (joints[edge.start].position.x + joints[edge.end].position.x) / 2,
        (joints[edge.start].position.y + joints[edge.end].position.y) / 2,
        0
      );
      cube.rotation.z = Math.atan2(
        joints[edge.end].position.y - joints[edge.start].position.y,
        joints[edge.end].position.x - joints[edge.start].position.x
      );

      scene.add(cube);
    });

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
