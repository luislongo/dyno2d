import * as MATH from "mathjs";
import { Edge, PointMass, StaticCharge, Structure } from "../parser/Parser";
import MatrixHelper from "./MatrixHelper";

export class DifferentialEquation {
  K: MATH.Matrix;
  Q: MATH.Matrix;
  U: MATH.Matrix;
  M: MATH.Matrix;
  freeDoFs: number[];
  redK : MATH.Matrix;
  redQ : MATH.Matrix;
  redM : MATH.Matrix;
  str: Structure;
  t: number = 0;

  constructor(str: Structure) {
    const {edges, joints, restrictions, staticCharges, pointMasses} = str;
    this.str = str;

    const n = Object.keys(joints).length;
    this.K = MATH.matrix(MATH.zeros(2*n, 2*n));
    this.M = MATH.matrix(MATH.zeros(2*n, 2*n));
    this.Q = MATH.matrix(MATH.zeros(2*n, 1));
    this.U = MATH.matrix(MATH.zeros(2 * n, 1));

    edges.forEach((edge) => {
      this.composeIntoK(edge, str);
    });

    staticCharges.forEach((charge) => {
      this.composeIntoQ(charge);
    })

    pointMasses.forEach((pointMass) => {
      this.composeIntoM(pointMass);
    })

    const doFs = Array.from(Array(2*n).keys());
    const restrictedDoFs = restrictions.reduce((acc, {joint, type}) => {
      switch(type) {
        case "x":
          acc.push(2*joint);
          break;
        case "y":
          acc.push(2*joint + 1);
          break;
        case "xy":
          acc.push(2*joint);
          acc.push(2*joint + 1);
          break;
      }
      return acc;
    }, [] as number[]);

    const freeDoFs = MATH.setDifference(doFs, restrictedDoFs);

    this.freeDoFs = freeDoFs;
    this.redK = this.K.subset(MATH.index(freeDoFs, freeDoFs));
    this.redQ = this.Q.subset(MATH.index(freeDoFs, 0));
    this.redM = this.M.subset(MATH.index(freeDoFs, freeDoFs));

    // this.staticSolve();
  }

  staticSolve = () => {
    const reducedU = MATH.lusolve(this.redK, this.redQ);

    this.freeDoFs.forEach((freeDoF, index) => {
      this.U.set([freeDoF, 0], reducedU.get([index, 0]));
    }
    );
  }

  dynamicSolveWithRungeKutta = (dt: number) => {
    this.t = this.t + dt;

    console.log(this.freeDoFs);
    this.redQ = this.Q.subset(
      MATH.index(this.freeDoFs, 0)
    ).map((value) => {
      return value * MATH.cos(this.t);
  });

    console.log(this.redQ)

    const reducedU = this.U.subset(MATH.index(this.freeDoFs, 0));
    const reducedV = MATH.multiply(this.redM, reducedU);
    const reducedA = MATH.multiply(MATH.inv(this.redM), MATH.subtract(this.redQ, MATH.multiply(this.redK, reducedU)));

    const k1 = MATH.multiply(dt, reducedV);
    const l1 = MATH.multiply(dt, reducedA);

    const k2 = MATH.multiply(dt, MATH.add(reducedV, MATH.multiply(0.5, l1)));
    const l2 = MATH.multiply(dt, MATH.add(reducedA, MATH.multiply(0.5, l1)));

    const k3 = MATH.multiply(dt, MATH.add(reducedV, MATH.multiply(0.5, l2)));
    const l3 = MATH.multiply(dt, MATH.add(reducedA, MATH.multiply(0.5, l2)));

    const k4 = MATH.multiply(dt, MATH.add(reducedV, l3));
    const l4 = MATH.multiply(dt, MATH.add(reducedA, l3));

    const k = k1.map((value, index, matrix) => {
      return (value + 2 * k2.get(index) + 2 * k3.get(index) + k4.get(index)) / 6;
    });
    const  l = l1.map((value, index, matrix) => {
      return (value + 2 * l2.get(index) + 2 * l3.get(index) + l4.get(index)) / 6;
    });
    
    const newReducedU = MATH.add(reducedU, k);

    this.freeDoFs.forEach((freeDoF, index) => {
      this.U.set([freeDoF, 0], newReducedU.get([index, 0]));
    });
  }

  composeIntoK = ({start, end, E, A } : Edge, { joints } : Structure) => {
    const startJoint = joints[start];
      const endJoint = joints[end];

      const edgeLength = Math.sqrt(
        Math.pow(startJoint.position.x - endJoint.position.x, 2) +
        Math.pow(startJoint.position.y - endJoint.position.y, 2)
      )
      const cx = (endJoint.position.x - startJoint.position.x) / edgeLength;
      const cy = (endJoint.position.y - startJoint.position.y) / edgeLength;
      const k0 = E * A / edgeLength;
 
      const cx2 = cx * cx;
      const cy2 = cy * cy;
      const cxcy = cx * cy;

      const kss = MATH.matrix([
        [cx2, cxcy, -cx2, -cxcy],
        [cxcy, cy2, -cxcy, -cy2],
      ])

      const kse = MATH.matrix([
        [-cx2, -cxcy, cx2, cxcy],
        [-cxcy, -cy2, cxcy, cy2],
      ])

      const kes = MATH.matrix([
        [-cx2, -cxcy, cx2, cxcy],
        [-cxcy, -cy2, cxcy, cy2],
      ])

      const kee = MATH.matrix([
        [cx2, cxcy, -cx2, -cxcy],
        [cxcy, cy2, -cxcy, -cy2],
      ])

      MatrixHelper.addMatrixToSubset(this.K, MATH.index([2*start, 2*start+1], [2*start, 2*start+1]), kss.map((value) => value * k0));
      MatrixHelper.addMatrixToSubset(this.K, MATH.index([2*start, 2*start+1], [2*end, 2*end+1]), kse.map((value) => value * k0));
      MatrixHelper.addMatrixToSubset(this.K, MATH.index([2*end, 2*end+1], [2*start, 2*start+1]), kes.map((value) => value * k0));
      MatrixHelper.addMatrixToSubset(this.K, MATH.index([2*end, 2*end+1], [2*end, 2*end+1]), kee.map((value) => value * k0));
      
    }

  composeIntoQ = ({joint: jointId, value, phase} : StaticCharge) => {
    const q = value * Math.cos(phase);
    const p = value * Math.sin(phase);

    MatrixHelper.addMatrixToSubset(this.Q, MATH.index([2*jointId, 2*jointId+1], [0]), MATH.matrix([[q], [p]]));
  }

  composeIntoM = ({joint: jointId, value} : PointMass) => {
    MatrixHelper.addMatrixToSubset(this.M, MATH.index([2*jointId, 2*jointId+1], [2*jointId, 2*jointId+1]), MATH.matrix([[value, 0], [0, value]]));
  }
}
