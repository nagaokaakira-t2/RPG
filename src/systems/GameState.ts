import Phaser from "phaser";
import { JobSystem } from "./JobSystem";
import type { Element } from "./Elements";

/**
 * シーン間で共有するゲーム状態のシングルトン。
 * Phaser.Events.EventEmitter を継承し、そのままイベントバスとしても使う。
 */
export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  str: number;
  int: number;
  vit: number;
  agi: number;
  luk: number;
}

class GameStateClass extends Phaser.Events.EventEmitter {
  /** 現在のプレイヤー座標（トップダウンシーン用。街⇄フィールド移動時の復帰に使う） */
  playerX = 400;
  playerY = 300;

  /** 直前にいたトップダウンシーンのキー（戦闘終了後に戻るため） */
  lastTopDownScene = "TownScene";

  /** 現在の基本ジョブID（Phase1では基本5ジョブのみ扱う） */
  currentJobId = "warrior";

  /** 1段階目派生ジョブID。null=未派生（4.1: 派生は一方通行のため、一度決まると変更不可） */
  derivedJobId: string | null = null;

  /** 派生の熟練度(JP)。4.3の解禁条件(恒常1段階目=JP30以上)と対応 */
  jp = 0;

  /** 現在の攻撃属性(6.3)。未派生の間は「無」属性 */
  element: Element = "無";

  stats: PlayerStats = {
    hp: 40,
    maxHp: 40,
    mp: 5,
    maxMp: 5,
    level: 1,
    str: 8,
    int: 2,
    vit: 7,
    agi: 4,
    luk: 4,
  };

  /** 戦闘に入るきっかけとなった敵シンボルのID（戦闘後の消去処理などに使う） */
  pendingEncounterId: string | null = null;

  /** ジョブ変更(街のギルドでの操作を想定)。派生済みの場合は変更不可(4.1: 一方通行) */
  changeJob(jobId: string) {
    if (this.derivedJobId) return;

    const hpRatio = this.stats.hp / this.stats.maxHp;
    const mpRatio = this.stats.maxMp > 0 ? this.stats.mp / this.stats.maxMp : 1;

    this.currentJobId = jobId;
    const computed = JobSystem.computeStats(jobId, this.stats.level);

    this.stats.maxHp = computed.maxHp;
    this.stats.maxMp = computed.maxMp;
    this.stats.str = computed.str;
    this.stats.int = computed.int;
    this.stats.vit = computed.vit;
    this.stats.agi = computed.agi;
    this.stats.luk = computed.luk;
    this.stats.hp = Math.round(this.stats.maxHp * hpRatio);
    this.stats.mp = Math.round(this.stats.maxMp * mpRatio);

    this.emit("job-changed", jobId);
  }

  /** 1段階目派生を確定する。一方通行(4.1)なので以後 changeJob は無効化される */
  deriveJob(tier1Id: string) {
    if (this.derivedJobId) return;

    const t1 = JobSystem.getTier1(tier1Id);
    this.derivedJobId = tier1Id;
    this.element = t1.element;

    this.stats.str += t1.statBonus.str;
    this.stats.int += t1.statBonus.int;
    this.stats.vit = Math.max(1, this.stats.vit + t1.statBonus.vit);
    this.stats.agi = Math.max(1, this.stats.agi + t1.statBonus.agi);
    this.stats.luk += t1.statBonus.luk;

    this.emit("job-derived", tier1Id);
  }

  /** 戦闘勝利時などにJPを加算 */
  gainJp(amount: number) {
    this.jp += amount;
    this.emit("jp-gained", this.jp);
  }
}

export const GameState = new GameStateClass();

