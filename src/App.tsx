import { useRef, useEffect } from "react";
import * as Three from "three";
import "./App.css";
import mockStr from "./algebra/mockStr.json";
import { Structure } from "./parser/Parser";
import { DifferentialEquation } from "./algebra/diffEq";

function App() {
  const renderer = new Three.WebGLRenderer();
  const scene = new Three.Scene();
  const camera = new Three.OrthographicCamera(
    0.2* window.innerWidth / -200,
    0.8*window.innerWidth / 200,
    0.8*window.innerHeight / 200,
    0.2* window.innerHeight / -200,
    0.1,
    1000
    );
  const canvasRef = useRef<HTMLDivElement>(null);
  const str = mockStr as Structure;
  const diffEq = new DifferentialEquation(str);
  const displacementMarkers = str.joints.reduce((acc, joint, id) => {
    const geometry = new Three.SphereGeometry(0.05, 32, 32);
    const material = new Three.MeshBasicMaterial({ color: 0x00ffff });
    const sphere = new Three.Mesh(geometry, material);
    sphere.position.set(joint.position.x, joint.position.y, 2.5);
       
    return [...acc, sphere]
  }, [] as Three.Mesh[]);
  const dynamicChargesMeshes = str.dynamicCharges.reduce((acc, charge, id) => {
    const shape = new Three.Shape()
      .moveTo(0, -0.025)
      .lineTo(0.5, -0.025)
      .lineTo(0.5, -0.1)
      .lineTo(0.65, 0)
      .lineTo(0.5, 0.1)
      .lineTo(0.5, 0.025)
      .lineTo(0, 0.025)
      .lineTo(0, -0.025);
    const geometry = new Three.ShapeGeometry(shape);
    const material = new Three.MeshBasicMaterial({ color: 0xff0000 });
    const arrow = new Three.Mesh(geometry, material);

    const position = str.joints[charge.joint].position;
    arrow.position.set(position.x, position.y, 2.5);
    
    return [...acc, arrow]
  }, [] as Three.Mesh[]);

  const loading = useRef<boolean>(true);

  useEffect(() => {
    canvasRef.current?.appendChild(renderer.domElement);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 5;

    const { joints, edges, restrictions, staticCharges, pointMasses, dynamicCharges } = mockStr as Structure;
    // Draw joints
    joints.forEach((joint) => {
      const geometry = new Three.SphereGeometry(0.1, 32, 32);
      const material = new Three.MeshBasicMaterial({ color: 0xffff00 });
      const sphere = new Three.Mesh(geometry, material);
      sphere.position.set(joint.position.x, joint.position.y, 0);
      scene.add(sphere);
    });

    // Draw edges
    edges.forEach((edge) => {
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

    // Draw charges
    staticCharges.forEach((charge) => {
      const shape = new Three.Shape()
        .moveTo(0, -0.025)
        .lineTo(0.5, -0.025)
        .lineTo(0.5, -0.1)
        .lineTo(0.65, 0)
        .lineTo(0.5, 0.1)
        .lineTo(0.5, 0.025)
        .lineTo(0, 0.025)
        .lineTo(0, -0.025);
      const geometry = new Three.ShapeGeometry(shape);
      const material = new Three.MeshBasicMaterial({ color: 0xff0000 });
      const arrow = new Three.Mesh(geometry, material);

      const position = joints[charge.joint].position;
      arrow.position.set(position.x, position.y, 0);
      arrow.scale.x = Math.sign(charge.value ? charge.value : 1);
      arrow.rotation.z = charge.phase;

      scene.add(arrow);
    });

    // Draw restrictions
    restrictions.forEach((restriction) => {
      const shape = new Three.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(0.25, -0.25);
      shape.lineTo(-0.25, -0.25);
      shape.lineTo(0, 0);

      const geometry = new Three.ShapeGeometry(shape);
      const material = new Three.MeshBasicMaterial({ color: 0x0000ff });

      const triangle = new Three.Mesh(geometry, material);
      const position = joints[restriction.joint].position;

      if (restriction.type === "x") {
        triangle.rotation.z = Math.PI / 2;
      }

      triangle.position.set(position.x, position.y, 0);

      scene.add(triangle);
    });

    //Draw displacement
    scene.add(...displacementMarkers)
    scene.add(...dynamicChargesMeshes)

    //Draw masses
    pointMasses.forEach((mass) => {
      const geometry = new Three.SphereGeometry(0.05, 32, 32);
      const material = new Three.MeshBasicMaterial({ color: 0x000000 });
      const sphere = new Three.Mesh(geometry, material);

      const position = joints[mass.joint].position;
      sphere.position.set(position.x, position.y, 1.5);

      scene.add(sphere);
    })

    loading.current = false;

    return () => {
      canvasRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  setInterval(() => {
    if(loading.current) return;

    diffEq.dynamicSolveWithRungeKutta(0.01);
    const { joints, dynamicCharges } = mockStr as Structure;
    displacementMarkers.forEach((marker, id) => {
      marker.position.x = joints[id].position.x + diffEq.U.get([2* id, 0])
      marker.position.y = joints[id].position.y + diffEq.U.get([2*id + 1, 0])
    })

    dynamicCharges.forEach((charge, id) => {
      dynamicChargesMeshes[id].rotation.z = charge.phase + charge.frequency * diffEq.t
    })

    renderer.render(scene, camera);
  }, 1000 / 60);

  const handleCanvasScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    camera.position.z += e.deltaY / 300;
    e.preventDefault();
  };

  window.addEventListener("keypress", (e) => {
    if (e.code === "KeyA") {
      camera.position.x -= 0.1;
    }
    if (e.code === "KeyD") {
      camera.position.x += 0.1;
    }
    if (e.code === "KeyW") {
      camera.position.y += 0.1;
    }
    if (e.code === "KeyS") {
      camera.position.y -= 0.1;
    }

  });

  return (
    <div className="canvas" onWheel={handleCanvasScroll} ref={canvasRef}></div>
  );
}

export default App;
