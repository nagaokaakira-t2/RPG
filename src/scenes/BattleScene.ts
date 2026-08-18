import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { JobSystem } from "../systems/JobSystem";
import { elementMultiplier, randomElement, type Element } from "../systems/Elements";

const BATTLE_WIN_JP = 15; // 4.3の解禁条件と整合させるJP獲得量

/**
 * サイドビュー戦闘。
 * 6.1: 移動・ジャンプ・攻撃・回避・ガード・被弾
 * 6.2: 必殺技ゲージ(攻撃を当てる/受けることで蓄積)
 * 6.3: 属性相性(弱点1.5倍/耐性0.5倍)
 */
export class BattleScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private enemy!: Phaser.Physics.Arcade.Sprite;

  private job = JobSystem.get(GameState.currentJobId);
  private playerElement: Element = GameState.element;
  private enemyElement: Element = randomElement();

  private playerHp = GameState.stats.hp;
  private playerMaxHp = GameState.stats.maxHp;
  private enemyHp = 20;
  private enemyMaxHp = 20;
  private specialGauge = 0;
  private readonly SPECIAL_MAX = 100;

  private playerHpBar!: Phaser.GameObjects.Graphics;
  private enemyHpBar!: Phaser.GameObjects.Graphics;
  private specialBar!: Phaser.GameObjects.Graphics;
  private message!: Phaser.GameObjects.Text;
  private elementLabel!: Phaser.GameObjects.Text;

  private attackKey!: Phaser.Input.Keyboard.Key;
  private specialKey!: Phaser.Input.Keyboard.Key;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private dodgeKey!: Phaser.Input.Keyboard.Key;
  private guardKey!: Phaser.Input.Keyboard.Key;

  private isAttacking = false;
  private isDodging = false;
  private isGuarding = false;
  private isInvincible = false;
  private battleOver = false;

  private readonly GROUND_Y_OFFSET = 140;
  private readonly JUMP_VELOCITY = -320;
  private readonly GRAVITY = 900;

  constructor() {
    super("BattleScene");
  }

  create() {
    const { width, height } = this.scale;
    this.job = JobSystem.get(GameState.currentJobId);
    this.playerElement = GameState.element;
    this.enemyElement = randomElement();
    this.specialGauge = 0;

    this.add.image(width / 2, height / 2, "battle-bg");
    const ground = this.add.rectangle(width / 2, height - 80, width, 8, 0x444444);
    this.physics.add.existing(ground, true);

    this.player = this.physics.add.sprite(160, height - this.GROUND_Y_OFFSET, "battle-player");
    this.player.setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setGravityY(this.GRAVITY);

    this.enemy = this.physics.add.sprite(width - 160, height - this.GROUND_Y_OFFSET, "battle-enemy");
    this.enemy.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.enemy, ground);

    this.playerHpBar = this.add.graphics();
    this.enemyHpBar = this.add.graphics();
    this.specialBar = this.add.graphics();
    this.drawBars();

    const jobLabel = GameState.derivedJobId
      ? JobSystem.getTier1(GameState.derivedJobId).name
      : this.job.name;
    this.add.text(60, 40, "自分", { fontSize: "14px", color: "#4ea3ff" });
    this.add.text(60, 58, `ジョブ: ${jobLabel}`, { fontSize: "12px", color: "#aaaaaa" });
    this.elementLabel = this.add.text(60, 74, `属性: ${this.playerElement}`, {
      fontSize: "12px",
      color: "#aaaaaa",
    });
    this.elementLabel.setVisible(true);

    this.add.text(this.scale.width - 110, 40, "敵", { fontSize: "14px", color: "#ff5a5a" });
    this.add.text(this.scale.width - 150, 58, `属性: ${this.enemyElement}`, {
      fontSize: "12px",
      color: "#aaaaaa",
    });

    const controlHint = this.job.canGuard
      ? "←→移動/SPACEジャンプ/Z攻撃/X必殺(満タン時)/SHIFT回避/Cガード"
      : "←→移動/SPACEジャンプ/Z攻撃/X必殺(満タン時)/SHIFT回避";
    this.message = this.add
      .text(width / 2, 100, controlHint, { fontSize: "13px", color: "#ffffff" })
      .setOrigin(0.5);

    this.attackKey = this.input.keyboard!.addKey("Z");
    this.specialKey = this.input.keyboard!.addKey("X");
    this.jumpKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.dodgeKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.guardKey = this.input.keyboard!.addKey("C");

    this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => this.enemyAttack(),
    });
  }

  update() {
    if (this.battleOver) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const cursors = this.input.keyboard!.createCursorKeys();
    const onGround = body.blocked.down || body.touching.down;

    if (!this.isDodging) {
      const speed = 180;
      body.setVelocityX(0);
      if (cursors.left.isDown) body.setVelocityX(-speed);
      if (cursors.right.isDown) body.setVelocityX(speed);
    }

    if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && onGround && !this.isDodging) {
      body.setVelocityY(this.JUMP_VELOCITY);
    }

    if (Phaser.Input.Keyboard.JustDown(this.dodgeKey) && !this.isDodging && !this.isAttacking) {
      this.dodge();
    }

    this.isGuarding = this.job.canGuard && this.guardKey.isDown && onGround && !this.isDodging;
    this.player.setAlpha(this.isGuarding ? 0.8 : 1);

    if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.isAttacking && !this.isDodging) {
      this.playerAttack(false);
    }

    if (
      Phaser.Input.Keyboard.JustDown(this.specialKey) &&
      !this.isAttacking &&
      !this.isDodging &&
      this.specialGauge >= this.SPECIAL_MAX
    ) {
      this.playerAttack(true);
    }
  }

  private dodge() {
    this.isDodging = true;
    this.isInvincible = true;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const facingRight = this.enemy.x > this.player.x;
    const dashDir = facingRight ? -1 : 1;

    body.setVelocityX(dashDir * 380);
    this.player.setTint(0xbfe9ff);

    this.time.delayedCall(220, () => {
      this.isDodging = false;
      this.isInvincible = false;
      this.player.clearTint();
    });
  }

  private playerAttack(isSpecial: boolean) {
    this.isAttacking = true;
    this.player.setTint(isSpecial ? 0xffe38b : 0xffffff);

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.enemy.x,
      this.enemy.y
    );

    this.time.delayedCall(isSpecial ? 260 : 150, () => {
      this.player.clearTint();
      this.isAttacking = false;

      if (distance < 140 && !this.battleOver) {
        const baseDmg = Phaser.Math.Between(3, 6) + Math.round(GameState.stats.str * 0.6);
        const mult = elementMultiplier(this.playerElement, this.enemyElement);
        const specialMult = isSpecial ? 2.2 : 1;
        const dmg = Math.max(1, Math.round(baseDmg * mult * specialMult));

        this.enemyHp = Math.max(0, this.enemyHp - dmg);
        this.enemy.setTint(0xffaaaa);
        this.time.delayedCall(100, () => this.enemy.clearTint());

        if (isSpecial) {
          this.specialGauge = 0;
        } else {
          this.specialGauge = Math.min(this.SPECIAL_MAX, this.specialGauge + 15);
        }
        this.drawBars();

        const suffix = mult > 1 ? "（弱点！）" : mult < 1 ? "（耐性…）" : "";
        this.message.setText(`${isSpecial ? "【必殺】" : ""}${dmg} ダメージ！${suffix}`);

        if (this.enemyHp <= 0) {
          this.win();
        }
      } else {
        this.message.setText("外れた…間合いを詰めよう");
      }
    });
  }

  private enemyAttack() {
    if (this.battleOver) return;

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.enemy.x,
      this.enemy.y
    );

    const body = this.enemy.body as Phaser.Physics.Arcade.Body;
    if (this.player.x < this.enemy.x) {
      body.setVelocityX(-60);
    } else {
      body.setVelocityX(60);
    }
    this.time.delayedCall(400, () => body.setVelocityX(0));

    if (distance < 120) {
      if (this.isInvincible) {
        this.message.setText("ジャスト回避！");
        return;
      }

      let dmg = Phaser.Math.Between(2, 5);
      if (this.isGuarding) {
        dmg = Math.max(0, Math.round(dmg * 0.3));
        this.message.setText(`ガード！ ${dmg} ダメージに軽減`);
      } else {
        this.message.setText(`${dmg} の被弾！`);
      }

      this.playerHp = Math.max(0, this.playerHp - dmg);
      this.specialGauge = Math.min(this.SPECIAL_MAX, this.specialGauge + 10);
      this.player.setTint(0xffaaaa);
      this.time.delayedCall(100, () => this.player.clearTint());
      this.drawBars();

      if (this.playerHp <= 0) {
        this.lose();
      }
    }
  }

  private drawBars() {
    this.playerHpBar.clear();
    this.playerHpBar.fillStyle(0x222222, 1);
    this.playerHpBar.fillRect(60, 20, 200, 14);
    this.playerHpBar.fillStyle(0x4ea3ff, 1);
    this.playerHpBar.fillRect(60, 20, 200 * (this.playerHp / this.playerMaxHp), 14);

    this.enemyHpBar.clear();
    this.enemyHpBar.fillStyle(0x222222, 1);
    this.enemyHpBar.fillRect(this.scale.width - 260, 20, 200, 14);
    this.enemyHpBar.fillStyle(0xff5a5a, 1);
    this.enemyHpBar.fillRect(
      this.scale.width - 260,
      20,
      200 * (this.enemyHp / this.enemyMaxHp),
      14
    );

    this.specialBar.clear();
    this.specialBar.fillStyle(0x222222, 1);
    this.specialBar.fillRect(60, 84, 200, 8);
    this.specialBar.fillStyle(this.specialGauge >= this.SPECIAL_MAX ? 0xffe38b : 0x8bd450, 1);
    this.specialBar.fillRect(60, 84, 200 * (this.specialGauge / this.SPECIAL_MAX), 8);
  }

  private win() {
    this.battleOver = true;
    GameState.stats.hp = this.playerHp;
    GameState.gainJp(BATTLE_WIN_JP);
    this.message.setText(`勝利！ JP+${BATTLE_WIN_JP}（合計${GameState.jp}） 街/フィールドに戻ります…`);
    this.time.delayedCall(1400, () => {
      this.scene.start(GameState.lastTopDownScene);
    });
  }

  private lose() {
    this.battleOver = true;
    this.message.setText("戦闘不能… (Phase1では即復帰)");
    GameState.stats.hp = this.playerMaxHp;
    this.time.delayedCall(1200, () => {
      this.scene.start(GameState.lastTopDownScene);
    });
  }
}
