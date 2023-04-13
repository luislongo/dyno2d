import * as Math from "mathjs";

export type Restriction = {
  joint: number;
  type: "x" | "y" | "xy";
};

export type Vector2 = {
  x: number;
  y: number;
};

export type Joint = {
  id: number;
  position: Vector2;
};

export type Edge = {
  id: string;
  start: number;
  end: number;
  E: number;
  A: number;
};

export type StaticCharges = {
  joint: number;
  value: number;
  phase: number;
};

export type Structure = {
  joints: Joint[];
  edges: Edge[];
  restrictions: Restriction[];
  staticCharges: StaticCharges[];
};
