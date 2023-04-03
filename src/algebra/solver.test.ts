import * as math from "mathjs";
import { describe, it, expect } from "vitest";
import { DifferentialEquation } from "./diffEq";
import { Structure } from "../parser/Parser";

describe("Solver", () => {
  it("Should reduce a matrix according to a boolean array", () => {
    const K = math.matrix([
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12],
      [13, 14, 15, 16, 17, 18],
      [19, 20, 21, 22, 23, 24],
      [25, 26, 27, 28, 29, 30],
      [31, 32, 33, 34, 35, 36],
    ]);
    const f = math.matrix([0, 1, 2, 4, 2, 0]);

    const r = [false, true, false, true, true, false];

    const diffEq = new DifferentialEquation(6);
    diffEq.K = K;
    diffEq.r = r;
    diffEq.f = f;

    const reducedK = diffEq.reducedK;
    const reducedf = diffEq.reducedf;

    expect(reducedK).toEqual(
      math.matrix([
        [1, 3, 6],
        [13, 15, 18],
        [31, 33, 36],
      ])
    );
    expect(reducedf).toEqual(math.matrix([1, 3, 6]));
  });

  it("Should be able to parse a structure from a JSON", () => {
    const json = require("./mockStr.json");
    const structure = json as Structure;

    console.log(structure);
  });
});
