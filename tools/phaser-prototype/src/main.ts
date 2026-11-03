import Phaser from "phaser";
import sceneData from "virtual:village-scene";
import type { SceneData } from "./types";
import { VillageScene } from "./scene";
import "./style.css";

const data = sceneData as unknown as SceneData;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 600,
  backgroundColor: "#0b1018",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: { debug: false }
  },
  scene: []
});

game.scene.add("village", VillageScene, true, data);
