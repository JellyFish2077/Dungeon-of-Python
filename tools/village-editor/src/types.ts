export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface RawHouse {
  name: string;
  roof: string;
  box: Box;
  door: Point;
  exit: Point;
  locked?: boolean;
}

export interface RawSealedHouse extends RawHouse {
  key: string;
}

export interface Sign {
  x: number;
  y: number;
  title: string;
  subtitle?: string;
  text: string;
  building?: string;
  builtTitle?: string;
  builtSubtitle?: string;
  builtText?: string;
}

export interface Npc {
  key: string;
  name: string;
  place: string;
  at: Point;
}

export interface VillageData {
  map: string[];
  houses: Record<string, RawHouse>;
  sealed: RawSealedHouse[];
  npcs: Npc[];
  signs: Sign[];
  spawn: Point;
  tiles: Record<string, unknown>;
}

export interface House {
  key: string;
  name: string;
  roof: string;
  box: Box;
  door: Point;
  exit: Point;
  locked: boolean;
  sealed: boolean;
}

export interface TileInfo {
  label: string;
  color: string;
  symbol: string;
}
