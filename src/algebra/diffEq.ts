import * as Math from "mathjs";

export class DifferentialEquation {
  K: Math.Matrix;
  f: Math.Matrix;
  r: boolean[];

  constructor(n: number) {
    this.K = Math.sparse(Array(n).fill(Array(n).fill(0)));
    this.f = Math.matrix(Array(n).fill(0));
    this.r = Array(n).fill(false);
  }

  get reducedK(): Math.Matrix {
    const matrixRange = [];
    for (let i = 0; i < this.r.length; i++) {
      if (!this.r[i]) {
        matrixRange.push(i);
      }
    }

    return Math.subset(this.K, Math.index(matrixRange, matrixRange));
  }

  get reducedf(): Math.Matrix {
    const matrixRange = [];
    for (let i = 0; i < this.r.length; i++) {
      if (!this.r[i]) {
        matrixRange.push(i);
      }
    }

    return Math.subset(this.f, Math.index(matrixRange));
  }
}
