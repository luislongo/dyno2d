import * as math from "mathjs";
import { describe, it, expect } from "vitest";
import { DifferentialEquation } from "./diffEq";
import { Structure } from "../parser/Parser";
import MatrixHelper from "./MatrixHelper";

describe("Solver", () => {
  it("Should be able to parse a structure from a JSON", () => {
    const json = require("./mockStr.json");
    const structure = json as Structure;
  });

  it("Should create edge stiffness matrices", () => {
    const json = require("./mockStr.json");
    const structure = json as Structure;
    const diffEq = new DifferentialEquation(structure);

    expect(diffEq).toBeDefined();
  });

  it('Should be able to apply matrix B to a subset of matrix A', () => {
    const A = math.matrix([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);

    const B = math.matrix([
      [1, 2],
      [3, 4],
    ]);

    const sum1 = MatrixHelper.applyOnSubset(A.clone(), math.index([0,1], [0,1]), (value, index, matrix) => {
      return value + B.get(index);
    })
    expect(sum1).toEqual(math.matrix([
      [2, 4, 3],
      [7, 9, 6],
      [7, 8, 9]
    ]));

    const sum2 = MatrixHelper.applyOnSubset(A.clone(), math.index([1,2], [0,1]), (value, index, matrix) => {
      return value + B.get(index);
    })
    expect(sum2).toEqual(math.matrix([
      [1, 2, 3],
      [5, 7, 6],
      [10, 12, 9]
    ]));

    const sum3 = MatrixHelper.applyOnSubset(A.clone(), math.index([0,1], [1,2]), (value, index, matrix) => {
      return value + B.get(index);
    })

    expect(sum3).toEqual(math.matrix([
      [1, 3, 5],
      [4, 8, 10],
      [7, 8, 9]
    ]));

    const sum4 = MatrixHelper.applyOnSubset(A.clone(), math.index([1,2], [1,2]), (value, index, matrix) => {
      return value + B.get(index);
    }
    )

    expect(sum4).toEqual(math.matrix([
      [1, 2, 3],
      [4, 6, 8],
      [7, 11, 13]
    ]));
  })

  it('Should be able to add matrix B to a subset of matrix A', () => {
    const A = math.matrix([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);

    const B = math.matrix([
      [1, 2],
      [3, 4],

    ]);

    const sum1 = MatrixHelper.addMatrixToSubset(A.clone(), math.index([0,1], [0,1]), B)

    expect(sum1).toEqual(math.matrix([
      [2, 4, 3],
      [7, 9, 6],
      [7, 8, 9]
    ]));
  })

  it("Should create the general stiffness matrix", () => {
    const json = require("./mockStr.json");
    const structure = json as Structure;

    const diffEq = new DifferentialEquation(structure);

    diffEq.dynamicSolveWithRungeKutta(0.01);
  })


});
