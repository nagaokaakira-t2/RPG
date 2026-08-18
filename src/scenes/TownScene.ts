import Phaser from "phaser";
import { Player } from "../entities/Player";
import { GameState } from "../systems/GameState";

/**
 * 「始まりの村」を想定した、Phase1用の最小構成トップダウンシーン。
 * フィールドへの出口ゾーンに触れると FieldScene へ遷移する。
 */
export class TownScene extends Phaser.Scene {
  private player!: Player;

  constructor() {
    super("TownScene");
  }

  create() {
    const { width, height } = this.scale;

    // 床
    for (let x = 0; x < width; x += 32) {
      for (let y = 0; y < height; y += 32) {
        this.add.image(x + 16, y + 16, "floor-tile").setDepth(0);
      }
    }

    // 外周の壁(簡易コリジョン)
    const walls = this.physics.add.staticGroup();
    const wallThickness = 32;
    for (let x = 0; x < width; x += wallThickness) {
      walls.create(x + 16, 16, "wall-tile");
      walls.create(x + 16, height - 16, "wall-tile");
    }
    for (let y = 0; y < height; y += wallThickness) {
      walls.create(16, y + 16, "wall-tile");
      walls.create(width - 16, y + 16, "wall-tile");
    }

    GameState.lastTopDownScene = "TownScene";
    this.player = new Player(this, GameState.playerX || width / 2, GameState.playerY || height / 2);
    this.physics.add.collider(this.player, walls);

    // NPCプレースホルダー(ギルド受付をイメージ)
    const guildNpc = this.add.zone(width / 2 + 80, height / 2 - 60, 40, 40);
    this.physics.add.existing(guildNpc, true);
    this.add.image(width / 2 + 80, height / 2 - 60, "npc-placeholder");
    this.add
      .text(width / 2 + 80, height / 2 - 90, "ギルド受付(仮) [Z]", {
        fontSize: "12px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const talkKey = this.input.keyboard!.addKey("Z");
    let nearGuild = false;
    this.physics.add.overlap(this.player, guildNpc, () => {
      nearGuild = true;
    });

    this.events.on("update", () => {
      nearGuild = Phaser.Math.Distance.Between(this.player.x, this.player.y, width / 2 + 80, height / 2 - 60) < 50;
    });

    talkKey.on("down", () => {
      if (nearGuild) {
        GameState.playerX = this.player.x;
        GameState.playerY = this.player.y;
        this.scene.pause();
        this.scene.launch("JobSelectScene");
      }
    });

    // フィールドへの出口ゾーン(画面下端)
    const exitZone = this.add.zone(width / 2, height - 40, 100, 20);
    this.physics.add.existing(exitZone, true);
    this.physics.add.overlap(this.player, exitZone, () => {
      GameState.playerX = width / 2;
      GameState.playerY = 80;
      this.scene.start("FieldScene");
    });

    this.add
      .text(width / 2, height - 60, "▼ フィールドへ", {
        fontSize: "12px",
        color: "#8bd450",
      })
      .setOrigin(0.5);

    this.cameras.main.setBackgroundColor("#101018");
  }

  update() {
    this.player.update();
    GameState.playerX = this.player.x;
    GameState.playerY = this.player.y;
  }
}
