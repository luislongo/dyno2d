import * as Math from "mathjs";

export type Restriction = {
  joint: string;
  type: "x" | "y" | "xy";
};

export type Vector2 = {
  x: number;
  y: number;
};

export type Joint = {
  id: string;
  position: Vector2;
};

export type Edge = {
  id: string;
  start: string;
  end: string;
};

export type StaticCharges = {
  joint: string;
  value: number;
  phase: number;
};

export type Structure = {
  joints: {
    [key: string]: Joint;
  };
  edges: Edge[];
  restrictions: Restriction[];
  staticCharges: StaticCharges[];
};
