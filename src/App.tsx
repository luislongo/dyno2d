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

  const restrictionMeshes = str.restrictions.reduce((acc, restriction, id) => {
    const shape = new Three.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.25, -0.25);
    shape.lineTo(-0.25, -0.25);
    shape.lineTo(0, 0);

    const geometry = new Three.ShapeGeometry(shape);
    const material = new Three.MeshBasicMaterial({ color: 0x0000ff });

    const triangle = new Three.Mesh(geometry, material);
    const position = str.joints[restriction.joint].position;

    if (restriction.type === "x") {
      triangle.rotation.z = Math.PI / 2;
    }

    triangle.position.set(position.x, position.y, 0);

    scene.add(triangle);

    return [...acc, triangle]
  }, [] as Three.Mesh[]);
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
  const edgeMeshes = str.edges.reduce((acc, edge, id) => {
    
    const geometry = new Three.BoxGeometry(1, 0.1, 0.1);
    const material = new Three.ShaderMaterial({  });

    const cube = new Three.Mesh(geometry, material);
    cube.position.set(
      (str.joints[edge.start].position.x + str.joints[edge.end].position.x) / 2,
      (str.joints[edge.start].position.y + str.joints[edge.end].position.y) / 2,
      0
    );
    cube.rotation.z = Math.atan2(
      str.joints[edge.end].position.y - str.joints[edge.start].position.y,
      str.joints[edge.end].position.x - str.joints[edge.start].position.x
    );

    return [...acc, cube]
  }, [] as Three.Mesh[]);
  const jointMeshes = str.joints.reduce((acc, joint, id) => {
    const geometry = new Three.SphereGeometry(0.1, 32, 32);
    const material = new Three.MeshBasicMaterial({ color: 0xffff00 });
    const sphere = new Three.Mesh(geometry, material);
    sphere.position.set(joint.position.x, joint.position.y, 0);
    return [...acc, sphere]
  }, [] as Three.Mesh[]);
  const pointMassMeshes = str.pointMasses.reduce((acc, pointMass, id) => {
    const geometry = new Three.SphereGeometry(0.1, 32, 32);
    const material = new Three.MeshBasicMaterial({ color: 0x00ff00 });
    const sphere = new Three.Mesh(geometry, material);
    sphere.position.set(str.joints[pointMass.joint].position.x, str.joints[pointMass.joint].position.y, 0);
    return [...acc, sphere]
  }, [] as Three.Mesh[]);
  const staticChargeMeshes = str.staticCharges.reduce((acc, charge, id) => {
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
    arrow.position.set(position.x, position.y, 0);
    arrow.rotation.z = charge.phase * Math.sign(charge.value);

    return [...acc, arrow]
  }, [] as Three.Mesh[]);
  const loading = useRef<boolean>(true);

  useEffect(() => {
    canvasRef.current?.appendChild(renderer.domElement);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 5;

    const { joints, restrictions } = mockStr as Structure;

  

    //Draw displacement
    scene.add(...displacementMarkers)
    scene.add(...dynamicChargesMeshes)
    scene.add(...staticChargeMeshes)
    scene.add(...edgeMeshes)
    scene.add(...jointMeshes)
    scene.add(...pointMassMeshes)
    scene.add(...restrictionMeshes)

    loading.current = false;

    return () => {
      canvasRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  setInterval(() => {
    if(loading.current) return;

    diffEq.dynamicSolveWithRungeKutta(0.01);
    const { joints, dynamicCharges, edges, staticCharges, restrictions } = mockStr as Structure;
    
    restrictions.forEach((restriction, id) => {
      restrictionMeshes[id].position.x = joints[restriction.joint].position.x + diffEq.U.get([2* restriction.joint, 0])
      restrictionMeshes[id].position.y = joints[restriction.joint].position.y + diffEq.U.get([2* restriction.joint + 1, 0])
      })
    

    displacementMarkers.forEach((marker, id) => {
      marker.position.x = joints[id].position.x + diffEq.U.get([2* id, 0])
      marker.position.y = joints[id].position.y + diffEq.U.get([2*id + 1, 0])
    })

    dynamicCharges.forEach((charge, id) => {
      dynamicChargesMeshes[id].position.x = joints[charge.joint].position.x + diffEq.U.get([2* charge.joint, 0])
      dynamicChargesMeshes[id].position.y = joints[charge.joint].position.y + diffEq.U.get([2* charge.joint + 1, 0])
      dynamicChargesMeshes[id].rotation.z = charge.phase + charge.frequency * diffEq.t
    })

    edges.forEach((edge, id) => {
      const length = Math.sqrt(
        Math.pow(
          joints[edge.start].position.x - joints[edge.end].position.x + diffEq.U.get([2* edge.start, 0]) - diffEq.U.get([2* edge.end, 0]),
          2
        ) +  
        Math.pow(
          joints[edge.start].position.y - joints[edge.end].position.y + diffEq.U.get([2* edge.start + 1, 0]) - diffEq.U.get([2* edge.end + 1, 0]),
          2
        )
      );
      
      edgeMeshes[id].scale.x = length;

      edgeMeshes[id].position.x = (joints[edge.start].position.x + joints[edge.end].position.x) / 2 + diffEq.U.get([2* edge.start, 0]) / 2 + diffEq.U.get([2* edge.end, 0]) / 2
      edgeMeshes[id].position.y = (joints[edge.start].position.y + joints[edge.end].position.y) / 2 + diffEq.U.get([2* edge.start + 1, 0]) / 2 + diffEq.U.get([2* edge.end + 1, 0]) / 2

      edgeMeshes[id].rotation.z = Math.atan2(
        joints[edge.end].position.y - joints[edge.start].position.y + diffEq.U.get([2* edge.end + 1, 0]) - diffEq.U.get([2* edge.start + 1, 0]),
        joints[edge.end].position.x - joints[edge.start].position.x + diffEq.U.get([2* edge.end, 0]) - diffEq.U.get([2* edge.start, 0])
      );
    });

    jointMeshes.forEach((joint, id) => {
      joint.position.x = joints[id].position.x + diffEq.U.get([2* id, 0])
      joint.position.y = joints[id].position.y + diffEq.U.get([2* id + 1, 0])
    })

    pointMassMeshes.forEach((mass, id) => {
      mass.position.x = joints[id].position.x + diffEq.U.get([2* id, 0])
      mass.position.y = joints[id].position.y + diffEq.U.get([2* id + 1, 0])
    })

    staticChargeMeshes.forEach((charge, id) => {
      charge.position.x = joints[staticCharges[id].joint].position.x + diffEq.U.get([2* staticCharges[id].joint, 0])
      charge.position.y = joints[staticCharges[id].joint].position.y + diffEq.U.get([2* staticCharges[id].joint + 1, 0])
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
