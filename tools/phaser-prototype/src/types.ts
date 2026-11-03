export interface Point {
  x: number;
  y: number;
}

export interface Prop {
  x: number;
  y: number;
  key: string;
  kind: string;
  title: string;
  text: string;
}

export interface Door {
  x: number;
  y: number;
  locked: boolean;
  key: string;
  name: string;
  texture: string;
}

export interface Npc {
  x: number;
  y: number;
  key: string;
  name: string;
  texture: string;
}

export interface Sign {
  x: number;
  y: number;
  title: string;
  text: string;
}

export interface SceneData {
  width: number;
  height: number;
  spawn: Point;
  player: string;
  ground: string[][];
  decor: string[][];
  props: Prop[];
  doors: Door[];
  npcs: Npc[];
  signs: Sign[];
  blocked: boolean[][];
  textures: Record<string, string>;
}
