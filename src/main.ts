import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { TownScene } from "./scenes/TownScene";
import { FieldScene } from "./scenes/FieldScene";
import { BattleScene } from "./scenes/BattleScene";
import { JobSelectScene } from "./scenes/JobSelectScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "app",
  pixelArt: true,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, TownScene, FieldScene, BattleScene, JobSelectScene],
};

new Phaser.Game(config);
