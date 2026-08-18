export type Element = "火" | "水" | "風" | "地" | "光" | "闇" | "無";

// 6.3: 火は風に強く水に弱い／水は火に強く地に弱い／風は地に強く火に弱い／地は水に強く風に弱い
// → 火→風→地→水→火 の四すくみサイクル
const CYCLE: Element[] = ["火", "風", "地", "水"];

/**
 * attacker属性がdefender属性に対して持つダメージ倍率を返す。
 * 1.5 = 弱点をつく／0.5 = 耐性で軽減／1.0 = 無効果
 */
export function elementMultiplier(attacker: Element, defender: Element): number {
  if (attacker === "無" || defender === "無") return 1.0;

  // 光と闇は相互弱点
  if ((attacker === "光" && defender === "闇") || (attacker === "闇" && defender === "光")) {
    return 1.5;
  }
  if (attacker === defender) return 1.0;

  const ai = CYCLE.indexOf(attacker);
  const di = CYCLE.indexOf(defender);
  if (ai === -1 || di === -1) return 1.0; // 光/闇 vs 火水風地の組み合わせは無効果扱い

  if ((ai + 1) % CYCLE.length === di) return 1.5; // attackerがdefenderに強い
  if ((di + 1) % CYCLE.length === ai) return 0.5; // attackerがdefenderに弱い(耐性)
  return 1.0;
}

export function randomElement(includeNeutral = true): Element {
  const pool: Element[] = ["火", "水", "風", "地", "光", "闇"];
  if (includeNeutral) pool.push("無");
  return pool[Math.floor(Math.random() * pool.length)];
}
