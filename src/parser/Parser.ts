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
  startId: string;
  endId: string;
};

export type Structure = {
  joints: Joint[];
  edges: Edge[];
  restrictions: Restriction[];
};
