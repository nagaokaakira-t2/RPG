import Phaser from "phaser";
import { Player } from "../entities/Player";
import { GameState } from "../systems/GameState";

/**
 * フィールド。敵シンボルが画面上を徘徊し、接触するとサイドビューの
 * BattleScene へトランジションする「シンボルエンカウント」を実装する。
 */
export class FieldScene extends Phaser.Scene {
  private player!: Player;
  private enemySymbols!: Phaser.Physics.Arcade.Group;

  constructor() {
    super("FieldScene");
  }

  create() {
    const { width, height } = this.scale;

    for (let x = 0; x < width; x += 32) {
      for (let y = 0; y < height; y += 32) {
        this.add.image(x + 16, y + 16, "floor-tile").setAlpha(0.6).setDepth(0);
      }
    }

    const walls = this.physics.add.staticGroup();
    for (let x = 0; x < width; x += 32) {
      walls.create(x + 16, 16, "wall-tile");
      walls.create(x + 16, height - 16, "wall-tile");
    }
    for (let y = 0; y < height; y += 32) {
      walls.create(16, y + 16, "wall-tile");
      walls.create(width - 16, y + 16, "wall-tile");
    }

    GameState.lastTopDownScene = "FieldScene";
    this.player = new Player(this, GameState.playerX || width / 2, GameState.playerY || 80);
    this.physics.add.collider(this.player, walls);

    // 敵シンボルを3体、ランダム徘徊させる
    this.enemySymbols = this.physics.add.group();
    for (let i = 0; i < 3; i++) {
      const ex = Phaser.Math.Between(100, width - 100);
      const ey = Phaser.Math.Between(150, height - 150);
      const symbol = this.enemySymbols.create(ex, ey, "enemy-symbol") as Phaser.Physics.Arcade.Sprite;
      symbol.setCollideWorldBounds(true);
      symbol.setBounce(1, 1);
      this.setRandomWander(symbol);
    }
    this.physics.add.collider(this.enemySymbols, walls);
    this.physics.add.collider(this.enemySymbols, this.enemySymbols);

    this.physics.add.overlap(this.player, this.enemySymbols, (_p, enemy) => {
      (enemy as Phaser.Physics.Arcade.Sprite).destroy();
      GameState.playerX = width / 2;
      GameState.playerY = height - 100;
      this.scene.start("BattleScene");
    });

    // 街への戻り口(画面上端)
    const backZone = this.add.zone(width / 2, 40, 100, 20);
    this.physics.add.existing(backZone, true);
    this.physics.add.overlap(this.player, backZone, () => {
      GameState.playerX = this.scale.width / 2;
      GameState.playerY = this.scale.height - 80;
      this.scene.start("TownScene");
    });

    this.add
      .text(width / 2, 60, "▲ 街へ戻る", { fontSize: "12px", color: "#8bd450" })
      .setOrigin(0.5);

    this.cameras.main.setBackgroundColor("#12181a");
  }

  private setRandomWander(symbol: Phaser.Physics.Arcade.Sprite) {
    const retarget = () => {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = 40;
      const body = symbol.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      this.time.delayedCall(Phaser.Math.Between(1500, 3000), retarget);
    };
    retarget();
  }

  update() {
    this.player.update();
  }
}
