import * as MATH from "mathjs";
import { Edge, StaticCharges, Structure } from "../parser/Parser";
import MatrixHelper from "./MatrixHelper";

export class DifferentialEquation {
  K: MATH.Matrix;
  Q: MATH.Matrix;
  U: MATH.Matrix;
  str: Structure;

  constructor(str: Structure) {
    const {edges, joints, restrictions, staticCharges} = str;
    this.str = str;

    const n = Object.keys(joints).length;
    this.K = MATH.matrix(MATH.zeros(2*n, 2*n));
    this.Q = MATH.matrix(MATH.zeros(2*n, 1));

    edges.forEach((edge) => {
      this.composeIntoK(edge, str);
    });

    staticCharges.forEach((charge) => {
      this.composeIntoQ(charge);
    })

    console.log(this.K);
    console.log(this.Q);

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

    const reducedK = this.K.subset(MATH.index(freeDoFs, freeDoFs));
    const reducedQ = this.Q.subset(MATH.index(freeDoFs, 0));

    console.log('reducedK', reducedK);
    console.log('reducedQ', reducedQ);

    const reducedU = MATH.lusolve(reducedK, reducedQ);
    console.log('reducedU', reducedU);

    const U = MATH.matrix(MATH.zeros(2 * n, 1));
    freeDoFs.forEach((freeDoF, index) => {
      U.set([freeDoF, 0], reducedU.get([index, 0]));
    }
    );
    console.log('U', U);

    this.U = U;
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

    composeIntoQ = ({joint: jointId, value, phase} : StaticCharges) => {
      const q = value * Math.cos(phase);
      const p = value * Math.sin(phase);

      MatrixHelper.addMatrixToSubset(this.Q, MATH.index([2*jointId, 2*jointId+1], [0]), MATH.matrix([[q], [p]]));
    }
}
