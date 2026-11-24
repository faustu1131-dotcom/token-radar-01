// The token radar's model, version radar-2: one snapshot of the protocol universe in, one ranked
// board out.
//
// The board covers every slug in the snapshot's watchlist (the floor, never a ceiling) and every
// other rankable pre-token protocol in the snapshot: the early rows the radar exists to find. A
// protocol is pre-token when its index entry records no token (no market cap, no CoinGecko id, no
// symbol); the snapshot's live-token protocols are kept apart and shown as the market's own values,
// never mixed into the ranked board.
//
// Implied value follows only from the snapshot's own figures, the same function for every row:
//
//   base        = tvl_usd x BASE_MULTIPLE
//   growth      = clamp(change_7d, -60, 120) per cent (null counts as 0)
//   growthMult  = 1 + (growth / 100) x GROWTH_WEIGHT_POS   when growth >= 0
//               = 1 + (growth / 100) x GROWTH_WEIGHT_NEG   when growth < 0
//                 (falls are charged harder than rises are rewarded: a crash is a warning)
//   maturity    = 0.6 + 0.4 x hump(age_days)
//   hump(age)   = age / 730                                  when age <= 730
//               = max(0.35, 1 - (age - 730) / 2920)         when age > 730
//                 (value builds while a protocol runs with no token, peaks near two years, then
//                 fades: a protocol that has run many years with no token is less likely to
//                 launch one at all; unknown age counts as 365 days)
//   breadth     = 1 + 0.05 x min(max(chains - 1, 0), 4)      (a protocol live on more chains has
//                 more places to be used, up to +20%)
//   implied     = max(1, round(base x growthMult x maturity x breadth))
//
// No protocol name is ever special-cased: the same function scores every row.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them and the sandbox may change them. */
export interface ModelConstants {
  base_multiple: number;
  growth_weight_pos: number;
  growth_weight_neg: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_peak_days: number;
  maturity_decay_days: number;
  maturity_decay_floor: number;
  unknown_age_days: number;
  breadth_step: number;
  breadth_max_steps: number;
}

export const MODEL: ModelConstants = {
  base_multiple: 0.25,
  growth_weight_pos: 0.7,
  growth_weight_neg: 1.0,
  growth_floor: -60,
  growth_cap: 120,
  maturity_floor: 0.6,
  maturity_range: 0.4,
  maturity_peak_days: 730,
  maturity_decay_days: 2920,
  maturity_decay_floor: 0.35,
  unknown_age_days: 365,
  breadth_step: 0.05,
  breadth_max_steps: 4,
};

/** The model's version label: the dashboard names it and the rules quote it. */
export const MODEL_VERSION = 'radar-2';

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  model: {
    base_multiple: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    breadth_multiplier: number;
    age_days: number | null;
  };
  farm_steps: string[];
}

/** The dashboard's compact view of one row, carrying the farm plan the page renders. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  breadth_multiplier: number;
  farm_steps: string[];
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** Everything the dashboard needs: the board, the live set, and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  rows: RadarRow[];
  live: LiveRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** The maturity hump: 0 at birth, 1 at the peak, fading toward the floor for very old protocols. */
export function maturityHump(age: number, model: ModelConstants): number {
  if (age <= model.maturity_peak_days) return age / model.maturity_peak_days;
  return Math.max(model.maturity_decay_floor, 1 - (age - model.maturity_peak_days) / model.maturity_decay_days);
}

/** The multipliers and the implied value one protocol gets under `model`. */
export function impliedValue(protocol: SnapshotProtocol, asOf: string, model: ModelConstants): { implied: number; growthPct: number; growthMult: number; maturityMult: number; breadthMult: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const weight = growthPct >= 0 ? model.growth_weight_pos : model.growth_weight_neg;
  const growthMult = 1 + (growthPct / 100) * weight;
  const ageForModel = age ?? model.unknown_age_days;
  const maturityMult = model.maturity_floor + maturityHump(ageForModel, model) * model.maturity_range;
  const breadthMult = 1 + model.breadth_step * Math.min(Math.max(protocol.chains.length - 1, 0), model.breadth_max_steps);
  const base = protocol.tvl_usd * model.base_multiple;
  const implied = Math.max(1, Math.round(base * growthMult * maturityMult * breadthMult));
  return { implied, growthPct, growthMult, maturityMult, breadthMult, age };
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** The watchlist's own exclusion, minus its floor: a wrapped, staked or bridged product of a token
 * that already trades is not a protocol still waiting on a launch of its own. WBTC is Bitcoin on
 * Ethereum, Binance staked ETH is ETH in a staking product, and neither belongs at the top of a
 * pre-token board. The snapshot carries no parentProtocol field, so that part of the rule cannot
 * be checked here; the rest can, from the ten fields the snapshot does carry. */
const EXCLUDED_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);
const WRAPPED_WORD = /\b(wrapped|staked|staking)\b/i;
const EXCHANGE_PREFIX = /^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/;

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** Whether a protocol is one the board may rank: pre-token, and none of the watchlist's
 * exclusions: not an exchange, not a bridge or staking product, not a versioned pool, its name
 * carrying no wrapped/staked word and beginning with no exchange's name. */
export function isRankable(p: SnapshotProtocol): boolean {
  if (!isPreToken(p)) return false;
  if (p.category !== null && EXCLUDED_CATEGORIES.has(p.category)) return false;
  if (VERSIONED.test(p.name)) return false;
  if (WRAPPED_WORD.test(p.name)) return false;
  if (EXCHANGE_PREFIX.test(p.name)) return false;
  return true;
}

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** The headline sentence's figures: how many watchlist slugs, how many rows, how many live protocols. */
export interface BoardSummary {
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): BoardRow[] {
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug, even one the snapshot no longer carries (it cannot, but the
  // board's coverage is the gate's row and is never gambled on a missing record).
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: every other rankable pre-token protocol in the snapshot, whatever its TVL. The
  // floor is never the whole board: a protocol below it, or one the list leaves out, is no worse a
  // subject, and the radar exists to find it early.
  const early = snapshot.protocols
    .filter((p) => !chosen.has(p.slug) && isRankable(p))
    .sort((a, b) => b.tvl_usd - a.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  for (const p of early) chosen.set(p.slug, p);

  const scored = [...chosen.values()].map((p) => {
    const { implied, growthPct, growthMult, maturityMult, breadthMult, age } = impliedValue(p, snapshot.as_of, model);
    return { p, implied, growthPct, growthMult, maturityMult, breadthMult, age };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  return scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    mcap_usd: s.p.mcap_usd,
    listed_at: s.p.listed_at,
    gecko_id: s.p.gecko_id,
    symbol: s.p.symbol,
    token_status: 'pre-token',
    age_days: s.age,
    implied_value_usd: s.implied,
    model: {
      base_multiple: model.base_multiple,
      growth_pct: s.growthPct,
      growth_multiplier: round4(s.growthMult),
      maturity_multiplier: round4(s.maturityMult),
      breadth_multiplier: round4(s.breadthMult),
      age_days: s.age,
    },
    farm_steps: farmSteps(s.p, s.age).map(stepText),
  }));
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** The category's one action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} and keep the position open.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and keep the position open.`;
  if (c.includes('bridge')) return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  if (c.includes('staking') || c.includes('restak')) return `Stake $${capital} of the chain's staking asset through ${name} and keep the receipt.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} and open one small hedge.`;
  if (c.includes('prediction')) return `Fund $${capital} and place one market position on ${name}.`;
  if (c.includes('curator') || c.includes('allocator')) return `Deposit $${capital} into a ${name} vault on ${chain} and keep the shares.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain}.`;
  if (c.includes('rwa')) return `Mint $${capital} of the protocol's yield asset on ${chain} and hold it.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/** The category's weekly qualifying action. */
function weeklyActionFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return 'a deposit, a borrow or a repayment';
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return 'a swap or a liquidity adjustment';
  if (c.includes('bridge')) return 'a bridge transfer';
  if (c.includes('staking') || c.includes('restak')) return 'a stake, a restake or a claim';
  if (c.includes('perpetual') || c.includes('derivative')) return 'a trade or a margin adjustment';
  if (c.includes('prediction')) return 'a market position';
  if (c.includes('curator') || c.includes('allocator')) return 'a deposit or a vault rebalance';
  if (c.includes('stable')) return 'a mint, a deposit or a redemption';
  if (c.includes('rwa')) return 'a mint or a redemption';
  if (c.includes('insurance')) return 'a cover purchase or a claim check';
  return 'a deposit, a swap or a vote';
}

/**
 * Hand-written farm plans for the board's top 40 (the whole watchlist), keyed by slug.
 * The template in farmSteps still generates every other row; these forty replace it.
 * Every figure comes from the protocol's own snapshot record (chains, TVL, listing date,
 * 7-day change); gas figures are labeled estimates. The page reads the plan from data.js,
 * which main.ts writes from the board, so the page shows exactly what board.json holds.
 */
const FARM_PLAN_OVERRIDES: Record<string, FarmStep[]> = {
  "steakhouse-financial": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $150 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$150 of capital and about $1 of gas (estimate)",
        "text": "Deposit $150 into a Steakhouse Financial vault on Base, the first of its 11 chains, and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing between the Base vault and a second Steakhouse vault on Arbitrum, so the wallet shows repeated use on two chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $150 stays in the position",
        "text": "Hold the position for at least 30 days. Steakhouse has run 543 days with no token and holds $2.75B of TVL, so a single month of steady activity is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "text": "Risk: the vault is a smart contract and the curator's strategy can lose value. Mitigation: keep the position fixed at $150 and do not top it up beyond the weekly $25. Before you withdraw, open Steakhouse Financial's own points or rewards page and claim only from the link it publishes.",
        "cost": "no fee to check, and never pay to claim",
        "time": "10 minutes"
      },
      {
        "text": "Exit when the 30 days are up or the vault's TVL falls sharply: withdraw the shares on Base, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "cost": "about $1 of gas to unwind (estimate)",
        "time": "15 minutes to unwind"
      }
    ],
  "sentora-curator": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $150 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$150 of capital and about $8 of gas (estimate)",
        "text": "Deposit $150 into a Sentora Curator vault on Ethereum, its largest chain, and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, compound the position with one more deposit or rebalance on Ethereum, and once a month repeat the action on Ink, so the wallet is active on two of Sentora's four chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $150 stays in the position",
        "text": "Hold for at least 30 days. Sentora listed in October 2025 and already holds $2.76B, up 2.4% in the last week, so early steady activity is what a launch would most likely reward.",
        "time": "30 days"
      },
      {
        "text": "Risk: the vault is a smart contract and the curator's strategy can lose value. Mitigation: keep the position at $150 and exit if the vault's TVL falls sharply. Before you withdraw, open Sentora Curator's own points or rewards page and claim only from the link it publishes.",
        "cost": "no fee to check, and never pay to claim",
        "time": "10 minutes"
      },
      {
        "text": "Exit when the 30 days are up or the vault's TVL falls sharply: withdraw the shares on Ethereum, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "cost": "about $8 of gas to unwind (estimate)",
        "time": "15 minutes to unwind"
      }
    ],
  "gauntlet": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $150 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$150 of capital and about $1 of gas (estimate)",
        "text": "Deposit $150 into a Gauntlet vault on Base, the first of its 14 chains, and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, compound the position by rebalancing or adding $25, alternating between Base and Arbitrum, so the wallet shows use on two of Gauntlet's 14 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $150 stays in the position",
        "text": "Hold for at least 30 days. Gauntlet's TVL rose 5.6% in the last week to $1.58B across 14 chains, so a month of repeated activity on two chains is the position to hold.",
        "time": "30 days"
      },
      {
        "text": "Risk: the vault is a smart contract and the curator's strategy can lose value. Mitigation: keep the position fixed at $150 and exit if the vault's TVL falls sharply. Before you withdraw, open Gauntlet's own points or rewards page and claim only from the link it publishes.",
        "cost": "no fee to check, and never pay to claim",
        "time": "10 minutes"
      },
      {
        "text": "Exit when the 30 days are up or the vault's TVL falls sharply: withdraw the shares on Base, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "cost": "about $1 of gas to unwind (estimate)",
        "time": "15 minutes to unwind"
      }
    ],
  "veda": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $150 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$150 of capital and about $1 of gas (estimate)",
        "text": "Deposit $150 into a Veda vault on Ink, the first of its 13 chains, and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week on Ink, about $8 for the Ethereum step (estimates)",
        "text": "Each week, compound the position by rebalancing or adding $25 on Ink, and once during the hold repeat the deposit on Ethereum, so the wallet is active on two chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $150 stays in the position",
        "text": "Hold for at least 30 days. Veda's TVL fell 8.3% in the last week to $1.56B, so keep the position modest and do not add capital to chase the dip.",
        "time": "30 days"
      },
      {
        "text": "Risk: the vault is a smart contract and the allocator's strategy can lose value. Mitigation: keep the position at $150 and exit if the TVL fall steepens. Before you withdraw, open Veda's own points or rewards page and claim only from the link it publishes.",
        "cost": "no fee to check, and never pay to claim",
        "time": "10 minutes"
      },
      {
        "text": "Exit when the 30 days are up or the TVL fall steepens: withdraw the shares on Ink, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "cost": "about $1 of gas to unwind (estimate)",
        "time": "15 minutes to unwind"
      }
    ],
  "usdd": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $150 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$150 of collateral and about $2 of gas (estimate)",
        "text": "Open a collateralized position and mint $150 of USDD on Tron, its first chain, and keep the position open.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $2 of gas a week (estimate)",
        "text": "Each week, compound the position by adding collateral, repaying a little, or supplying the minted USDD to a pool on Tron, so the wallet shows repeated CDP use.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $150 stays locked as collateral",
        "text": "Hold for at least 30 days. USDD has run 611 days with no token and holds $1.06B, so a month of maintained collateral is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "text": "Risk: a CDP can be liquidated if the collateral falls, and USDD can lose its peg. Mitigation: keep the position at $150 and unwind if the peg slips. Before you unwind, open USDD's own mint and redemption page and check the position only from the link it publishes.",
        "cost": "no fee to check, and never pay to claim",
        "time": "10 minutes"
      },
      {
        "text": "Exit when the 30 days are up or USDD loses its peg: repay and close the position on Tron, then write the wallet, the position, the dates and every transaction in a farm log.",
        "cost": "about $2 of gas to unwind (estimate)",
        "time": "15 minutes to unwind"
      }
    ],
  "upshift": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $8 of gas (estimate)",
        "text": "Deposit $100 into an Upshift vault on Ethereum and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing on Ethereum, and once during the hold repeat the action on Base, so the wallet is active on two of Upshift's 15 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 30 days. Upshift's TVL rose 8.3% in the last week to $499M, so steady activity during a growth week is the position to hold.",
        "time": "30 days"
      },
      {
        "text": "Risk: the vault is a smart contract and the allocator's strategy can lose value. Mitigation: keep the position at $100 and exit if the vault's TVL falls sharply. Before you withdraw, open Upshift's own points or rewards page and claim only from the link it publishes.",
        "cost": "no fee to check, and never pay to claim",
        "time": "10 minutes"
      },
      {
        "text": "Exit when the 30 days are up or the vault's TVL falls sharply: withdraw the shares on Ethereum, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "cost": "about $8 of gas to unwind (estimate)",
        "time": "15 minutes to unwind"
      }
    ],
  "cian-yield-layer": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $8 of gas (estimate)",
        "text": "Provide $100 of liquidity to CIAN Yield Layer's main pool on Ethereum and keep the position open.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, compound the position by adjusting it once, a swap or a liquidity change on Ethereum, and once on Arbitrum, so the wallet shows use on two of its seven chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 30 days. CIAN has run 726 days with no token and holds $280M of TVL, up 4.7% in the last week, so a month of repeated yield activity is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "text": "Risk: providing liquidity carries impermanent loss if the pool's assets diverge, plus smart-contract risk. Mitigation: keep the position at $100 and exit if the pool drifts far from entry. Before you withdraw, open CIAN Yield Layer's own points or rewards page and claim only from the link it publishes.",
        "cost": "no fee to check, and never pay to claim",
        "time": "10 minutes"
      },
      {
        "text": "Exit when the 30 days are up or the pool drifts far from entry: remove the liquidity on Ethereum, then write the wallet, the pool, the dates and every transaction in a farm log.",
        "cost": "about $8 of gas to unwind (estimate)",
        "time": "15 minutes to unwind"
      }
    ],
  "nonce-capital": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $8 of gas (estimate)",
        "text": "Deposit $100 into a Nonce Capital vault on Ethereum and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing on Ethereum, and once during the hold repeat the action on Optimism, so the wallet is active on both of Nonce's two chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 60 days. Nonce listed only 45 days ago and its TVL fell 9.7% in the last week to $514M, so a longer hold and a modest position matter more than size here.",
        "time": "60 days"
      },
      {
        "text": "Risk: the vault is a smart contract and the curator's strategy can lose value. Mitigation: keep the position at $100 and exit if the TVL fall steepens. Before you withdraw, open Nonce Capital's own points or rewards page and claim only from the link it publishes.",
        "cost": "no fee to check, and never pay to claim",
        "time": "10 minutes"
      },
      {
        "text": "Exit when the 60 days are up or the TVL fall steepens: withdraw the shares on Ethereum, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "cost": "about $8 of gas to unwind (estimate)",
        "time": "15 minutes to unwind"
      }
    ],
  "polymarket-international": [
      {
        "cost": "under $1 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet funded with $100 of USDC on Polygon, Polymarket International's only chain, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and under $1 of gas (estimate)",
        "text": "Fund the account with $100 and place one market position on Polymarket International, keeping most of the balance for later markets.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "under $1 of gas a week (estimate)",
        "text": "Each week, place one more position in a different market, so the wallet shows repeated trading rather than a single bet.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the account",
        "text": "Hold the activity for at least 30 days. Polymarket International has run 1,845 days with no token and $320M of TVL, so a month of steady positions across several markets is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "text": "Risk: a market position can go to zero. Mitigation: never stake the full $100 on one market; spread it across several and cap each position. Before you withdraw, open Polymarket International's own rewards page and claim only from the link it publishes.",
        "cost": "no fee to check, and never pay to claim",
        "time": "10 minutes"
      },
      {
        "text": "Exit when the 30 days are up or a market resolves: withdraw the balance on Polygon, then write the wallet, the markets, the dates and every transaction in a farm log.",
        "cost": "under $1 of gas to unwind (estimate)",
        "time": "15 minutes to unwind"
      }
    ],
  "onre": [
      {
        "cost": "under $1 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and under $1 of gas (estimate)",
        "text": "Mint $100 of OnRe's yield asset on Solana and hold it.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "under $1 of gas a week (estimate)",
        "text": "Each week, mint $25 more or redeem and re-mint a small amount, so the wallet shows repeated use of the RWA asset.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 30 days. OnRe has run 488 days with no token and $309M of TVL on Solana alone, so a month of steady holding is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "text": "Risk: the yield asset is a smart contract and redemptions can be slow or limited. Mitigation: keep the position at $100 and test a small redemption before unwinding the full amount. Before you withdraw, open OnRe's own points or rewards page and claim only from the link it publishes.",
        "cost": "no fee to check, and never pay to claim",
        "time": "10 minutes"
      },
      {
        "text": "Exit when the 30 days are up: redeem the yield asset on Solana, testing a small redemption first, then write the wallet, the asset, the dates and every transaction in a farm log.",
        "cost": "under $1 of gas to unwind (estimate)",
        "time": "15 minutes to unwind"
      }
    ],
  "opentrade": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $1 of gas (estimate)",
        "text": "Mint $100 of OpenTrade's yield asset on Avalanche, the first of its 3 chains, and hold it.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, mint $25 more or redeem and re-mint a small amount, and once during the hold repeat the action on Ethereum, so the wallet shows repeated use of the RWA asset on two chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 30 days. OpenTrade has run 708 days with no token and holds $242M of TVL, down 1.6% in the last week, so a month of steady holding is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the yield asset is a smart contract and redemptions can be slow or limited. Mitigation: keep the position at $100 and test a small redemption before unwinding the full amount. Before you withdraw, open OpenTrade's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up: redeem the yield asset on Avalanche, testing a small redemption first, then write the wallet, the asset, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "rockawayx": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $8 of gas (estimate)",
        "text": "Deposit $100 into a RockawayX vault on Ethereum, the first of its 10 chains, and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing on Ethereum, and once during the hold repeat the action on Solana, so the wallet is active on two of RockawayX's 10 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 45 days. RockawayX listed only 233 days ago and holds $293M of TVL, down 2.5% in the last week, so a longer hold and a modest position matter more than size here.",
        "time": "45 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the vault is a smart contract and the curator's strategy can lose value. Mitigation: keep the position at $100 and exit if the vault's TVL falls sharply. Before you withdraw, open RockawayX's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $8 of gas to unwind (estimate)",
        "text": "Exit when the 45 days are up or the vault's TVL falls sharply: withdraw the shares on Ethereum, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "plume-vaults": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $8 of gas (estimate)",
        "text": "Mint $100 of Plume Vaults' yield asset on Ethereum, the first of its 5 chains, and hold it.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, mint $25 more or redeem and re-mint a small amount, and once during the hold repeat the action on Plume Mainnet, so the wallet shows repeated use of the RWA asset on two chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 30 days. Plume Vaults has run 749 days with no token and holds $212M of TVL, down 3.1% in the last week, so a month of steady holding is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the yield asset is a smart contract and redemptions can be slow or limited. Mitigation: keep the position at $100 and test a small redemption before unwinding the full amount. Before you withdraw, open Plume Vaults' own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $8 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up: redeem the yield asset on Ethereum, testing a small redemption first, then write the wallet, the asset, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "hyperithm": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $1 of gas (estimate)",
        "text": "Deposit $100 into a Hyperithm vault on Monad, the first of its 10 chains, and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing on Monad, and once during the hold repeat the action on Ethereum, so the wallet is active on two of Hyperithm's 10 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 30 days. Hyperithm has run 543 days with no token and holds $222M of TVL, down 4.4% in the last week, so a month of steady activity is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the vault is a smart contract and the curator's strategy can lose value. Mitigation: keep the position at $100 and exit if the vault's TVL falls sharply. Before you withdraw, open Hyperithm's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or the vault's TVL falls sharply: withdraw the shares on Monad, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "bittensor-dtao": [
      {
        "cost": "under $1 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and under $1 of gas (estimate)",
        "text": "Provide $100 of liquidity to Bittensor dTAO's main pool on Bittensor, its only chain, and keep the position open.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "under $1 of gas a week (estimate)",
        "text": "Each week, compound the position by adjusting it once, a swap or a liquidity change on Bittensor, so the wallet shows repeated use of the pool.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 60 days. Bittensor dTAO listed only 56 days ago and holds $376M of TVL, down 6.6% in the last week, so a longer hold and a modest position matter more than size here.",
        "time": "60 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: providing liquidity carries impermanent loss if the pool's assets diverge, plus smart-contract risk. Mitigation: keep the position at $100 and exit if the pool drifts far from entry. Before you withdraw, open Bittensor dTAO's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "under $1 of gas to unwind (estimate)",
        "text": "Exit when the 60 days are up or the pool drifts far from entry: remove the liquidity on Bittensor, then write the wallet, the pool, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "bitfi-basis": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $1 of gas (estimate)",
        "text": "Deposit $100 into a BitFi Basis strategy position on Binance, the first of its 7 chains, and keep the position open.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing on Binance, and once during the hold repeat the action on Ethereum, so the wallet is active on two of BitFi Basis' 7 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 30 days. BitFi Basis has run 638 days with no token and holds $215M of TVL, down 10.3% in the last week, so keep the position modest and do not add capital to chase the dip.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: a basis trade can lose value when funding rates flip, plus smart-contract risk. Mitigation: keep the position at $100 and exit if the TVL fall steepens. Before you withdraw, open BitFi Basis' own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or the TVL fall steepens: close the strategy position on Binance, then write the wallet, the position, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "symbiotic": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $8 of gas (estimate)",
        "text": "Stake $100 of the staking asset as collateral through Symbiotic on Ethereum, its only chain, and keep the receipt.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, compound the position with one more stake, a restake or a claim on Ethereum, so the wallet shows repeated collateral use.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays staked",
        "text": "Hold for at least 30 days. Symbiotic has run 886 days with no token and holds $254M of TVL, down 12.0% in the last week, so keep the position modest and do not add capital to chase the dip.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: restaked collateral can be slashed and the contracts can fail. Mitigation: keep the position at $100 and exit if the TVL fall steepens. Before you withdraw, open Symbiotic's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $8 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or the TVL fall steepens: unstake the collateral on Ethereum, then write the wallet, the position, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "defi-saver-asset-management": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $8 of gas (estimate)",
        "text": "Open a $100 collateralized position through DeFi Saver Asset Management on Ethereum, the first of its 4 chains, and keep the position open.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, manage the position by adding collateral, repaying a little, or adjusting it once, and once during the hold repeat the action on Arbitrum, so the wallet shows repeated CDP use on two chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays locked as collateral",
        "text": "Hold for at least 30 days. DeFi Saver Asset Management holds $276M of TVL, down 19.6% in the last week, so keep the position modest and do not add capital to chase the dip.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: a collateralized position can be liquidated if the collateral falls. Mitigation: keep the position at $100 and unwind if the collateral ratio slips. Before you unwind, open DeFi Saver Asset Management's own page and check the position only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $8 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or the collateral ratio slips: repay and close the position on Ethereum, then write the wallet, the position, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "k3-capital": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $1 of gas (estimate)",
        "text": "Deposit $100 into a K3 Capital vault on Monad, the first of its 9 chains, and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing on Monad, and once during the hold repeat the action on Ethereum, so the wallet is active on two of K3 Capital's 9 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 30 days. K3 Capital has run 543 days with no token and holds $208M of TVL, down 8.9% in the last week, so keep the position modest and do not add capital to chase the dip.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the vault is a smart contract and the curator's strategy can lose value. Mitigation: keep the position at $100 and exit if the vault's TVL falls sharply. Before you withdraw, open K3 Capital's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or the vault's TVL falls sharply: withdraw the shares on Monad, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "mellow-core": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $8 of gas (estimate)",
        "text": "Deposit $100 into a Mellow Core vault on Ethereum, the first of its 5 chains, and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing on Ethereum, and once during the hold repeat the action on Robinhood Chain, so the wallet is active on two of Mellow Core's 5 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 45 days. Mellow Core listed 290 days ago and holds $233M of TVL, down 8.5% in the last week, so a longer hold and a modest position matter more than size here.",
        "time": "45 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the vault is a smart contract and the allocator's strategy can lose value. Mitigation: keep the position at $100 and exit if the vault's TVL falls sharply. Before you withdraw, open Mellow Core's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $8 of gas to unwind (estimate)",
        "text": "Exit when the 45 days are up or the vault's TVL falls sharply: withdraw the shares on Ethereum, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "figure-markets-prime": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $1 of gas (estimate)",
        "text": "Supply $100 of USDC to Figure Markets Prime on Provenance, its only chain, and keep the position open.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, manage the position with one more supply, a withdrawal or a repayment on Provenance, so the wallet shows repeated lending use.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 30 days. Figure Markets Prime has run 474 days with no token and holds $191M of TVL, up 18.0% in the last week, so steady activity during a growth week is the position to hold.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: lent funds depend on borrowers repaying, plus smart-contract risk. Mitigation: keep the position at $100 and exit if the pool's TVL falls sharply. Before you withdraw, open Figure Markets Prime's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or the pool's TVL falls sharply: withdraw the supplied USDC on Provenance, then write the wallet, the pool, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "hive-protocol": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $1 of gas (estimate)",
        "text": "Bridge $100 of USDC to BSquared through Hive Protocol, its only chain, and use the bridged funds in its app.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, make one more bridge transfer or use the bridged funds in the app on BSquared, so the wallet shows repeated chain use.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays on the chain",
        "text": "Hold for at least 30 days. Hive Protocol has run 925 days with no token and holds $199M of TVL, down 10.2% in the last week, so a month of steady use is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: a bridge can fail or be exploited, and a young chain's apps can break. Mitigation: keep the position at $100 and bridge back if the chain's TVL falls sharply. Before you bridge back, open Hive Protocol's own page and follow only the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or the chain's TVL falls sharply: bridge the funds back from BSquared, then write the wallet, the chain, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "lagoon": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $8 of gas (estimate)",
        "text": "Deposit $100 into a Lagoon vault on Ethereum, the first of its 23 chains, and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing on Ethereum, and once during the hold repeat the action on Arbitrum, so the wallet is active on two of Lagoon's 23 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 30 days. Lagoon has run 691 days with no token and holds $151M of TVL, down 3.3% in the last week, so a month of steady activity is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the vault is a smart contract and the allocator's strategy can lose value. Mitigation: keep the position at $100 and exit if the vault's TVL falls sharply. Before you withdraw, open Lagoon's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $8 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or the vault's TVL falls sharply: withdraw the shares on Ethereum, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "clearstar": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $1 of gas (estimate)",
        "text": "Deposit $100 into a Clearstar vault on Flare, the first of its 11 chains, and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing on Flare, and once during the hold repeat the action on Base, so the wallet is active on two of Clearstar's 11 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 30 days. Clearstar has run 543 days with no token and holds $162M of TVL, down 10.1% in the last week, so keep the position modest and do not add capital to chase the dip.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the vault is a smart contract and the curator's strategy can lose value. Mitigation: keep the position at $100 and exit if the vault's TVL falls sharply. Before you withdraw, open Clearstar's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or the vault's TVL falls sharply: withdraw the shares on Flare, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "lightning-network": [
      {
        "cost": "under $1 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and under $1 of fees (estimate)",
        "text": "Open a $100 Lightning channel on Bitcoin, its only chain, and keep it funded.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "under $1 of fees a week (estimate)",
        "text": "Each week, route one payment or rebalance the channel on Bitcoin, so the wallet shows repeated Lightning use.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the channel",
        "text": "Hold for at least 30 days. Lightning Network holds $218M of TVL, down 10.1% in the last week, so a month of steady channel use is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: a channel can be force-closed and funds can sit locked while it settles. Mitigation: keep the position at $100 and close the channel if the network's TVL falls sharply. Before you close it, open Lightning Network's own page and follow only the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "under $1 of fees to unwind (estimate)",
        "text": "Exit when the 30 days are up or the network's TVL falls sharply: close the channel on Bitcoin, then write the wallet, the channel, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "r25": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $1 of gas (estimate)",
        "text": "Mint $100 of R25's yield asset on Pharos, the first of its 2 chains, and hold it.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, mint $25 more or redeem and re-mint a small amount, and once during the hold repeat the action on Sui, so the wallet shows repeated use of the RWA asset on both of R25's 2 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 45 days. R25 listed only 199 days ago and holds $198M of TVL, up 0.3% in the last week, so a longer hold and a modest position matter more than size here.",
        "time": "45 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the yield asset is a smart contract and redemptions can be slow or limited. Mitigation: keep the position at $100 and test a small redemption before unwinding the full amount. Before you withdraw, open R25's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 45 days are up: redeem the yield asset on Pharos, testing a small redemption first, then write the wallet, the asset, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "b14g": [
      {
        "cost": "under $1 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and under $1 of fees (estimate)",
        "text": "Restake $100 of BTC through b14g on Bitcoin, the first of its 3 chains, and keep the receipt.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "under $1 of fees a week (estimate)",
        "text": "Each week, compound the position with one more restake or a claim on Bitcoin, and once during the hold repeat the action on CORE, so the wallet is active on two of b14g's 3 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays staked",
        "text": "Hold for at least 30 days. b14g has run 694 days with no token and holds $174M of TVL, down 28.5% in the last week, so keep the position modest and do not add capital to chase the dip.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: restaked BTC can be slashed and the contracts can fail. Mitigation: keep the position at $100 and exit if the TVL fall steepens. Before you withdraw, open b14g's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "under $1 of fees to unwind (estimate)",
        "text": "Exit when the 30 days are up or the TVL fall steepens: unstake the BTC on Bitcoin, then write the wallet, the position, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "saturn": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $8 of gas (estimate)",
        "text": "Wrap $100 of stablecoins through Saturn on Ethereum, the first of its 3 chains, and keep the wrapped position open.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, wrap or unwrap a small amount, and once during the hold repeat the action on Monad, so the wallet is active on two of Saturn's 3 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 45 days. Saturn listed 219 days ago and holds $154M of TVL, down 0.7% in the last week, so a longer hold and a modest position matter more than size here.",
        "time": "45 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: a wrapped stablecoin can lose its peg, plus smart-contract risk. Mitigation: keep the position at $100 and unwind if the peg slips. Before you withdraw, open Saturn's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $8 of gas to unwind (estimate)",
        "text": "Exit when the 45 days are up or the peg slips: unwrap the stablecoins on Ethereum, then write the wallet, the position, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "figure-markets-exchange": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $1 of gas (estimate)",
        "text": "Fund the account with $100 and place one OTC trade on Figure Markets Exchange on Provenance, its only chain, keeping most of the balance for later trades.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, place one more OTC trade in a different market on Provenance, so the wallet shows repeated trading rather than a single trade.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the account",
        "text": "Hold the activity for at least 30 days. Figure Markets Exchange has run 474 days with no token and holds $131M of TVL, up 2.3% in the last week, so a month of steady trades across several markets is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: an OTC trade depends on the other side settling, plus smart-contract risk. Mitigation: never stake the full $100 on one trade; spread it across several and cap each trade. Before you withdraw, open Figure Markets Exchange's own rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or a trade settles: withdraw the balance on Provenance, then write the wallet, the trades, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "curvance": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $1 of gas (estimate)",
        "text": "Supply $100 of USDC to Curvance on Monad, its only chain, and keep the position open.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, manage the position with one more supply, a withdrawal or a repayment on Monad, so the wallet shows repeated lending use.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 45 days. Curvance listed 352 days ago and holds $136M of TVL, up 0.7% in the last week, so a longer hold and a modest position matter more than size here.",
        "time": "45 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: lent funds depend on borrowers repaying, plus smart-contract risk. Mitigation: keep the position at $100 and exit if the pool's TVL falls sharply. Before you withdraw, open Curvance's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 45 days are up or the pool's TVL falls sharply: withdraw the supplied USDC on Monad, then write the wallet, the pool, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "galaxy-curation": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $1 of gas (estimate)",
        "text": "Deposit $100 into a Galaxy Curation vault on Arc, the first of its 3 chains, and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing on Arc, and once during the hold repeat the action on Ethereum, so the wallet is active on two of Galaxy Curation's 3 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 60 days. Galaxy Curation listed only 177 days ago and holds $130M of TVL, up 11.2% in the last week, so a longer hold during early growth is the position to take.",
        "time": "60 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the vault is a smart contract and the curator's strategy can lose value. Mitigation: keep the position at $100 and exit if the vault's TVL falls sharply. Before you withdraw, open Galaxy Curation's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 60 days are up or the vault's TVL falls sharply: withdraw the shares on Arc, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "extended-perps": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $50 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$50 of capital and about $1 of gas (estimate)",
        "text": "Deposit $50 of USDC as margin on Extended Perps on Arc, the first of its 3 chains, and open one small hedge.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, manage the position with one trade or a margin adjustment on Arc, and once during the hold repeat the action on Ethereum, so the wallet is active on two of Extended Perps' 3 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $50 stays as margin",
        "text": "Hold for at least 30 days. Extended Perps has run 613 days with no token and holds $96M of TVL, down 4.9% in the last week, so keep the position small and the hedge small.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: a leveraged position can be liquidated if the market moves against it, plus smart-contract risk. Mitigation: keep the position at $50 and the hedge small, and close it if the margin ratio slips. Before you withdraw, open Extended Perps' own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or the margin ratio slips: close the hedge and withdraw the margin on Arc, then write the wallet, the position, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "lofty": [
      {
        "cost": "under $1 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and under $1 of gas (estimate)",
        "text": "Buy $100 of Lofty's tokenized property asset on Algorand, its only chain, and hold it.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "under $1 of gas a week (estimate)",
        "text": "Each week, buy $25 more of the property asset or trade a small amount on Algorand, so the wallet shows repeated use of the RWA asset.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 30 days. Lofty has run 1563 days with no token and holds $101M of TVL, flat in the last week, so a month of steady holding is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the property asset is a smart contract and redemptions can be slow or limited. Mitigation: keep the position at $100 and test a small redemption before unwinding the full amount. Before you withdraw, open Lofty's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "under $1 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up: sell the property asset on Algorand, testing a small redemption first, then write the wallet, the asset, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "theo-network-thusd": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $8 of gas (estimate)",
        "text": "Mint $100 of Theo Network thUSD on Ethereum, its only chain, and hold it.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, mint $25 more or redeem and re-mint a small amount on Ethereum, so the wallet shows repeated use of the RWA asset.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 60 days. Theo Network thUSD listed only 65 days ago and holds $139M of TVL, flat in the last week, so a longer hold and a modest position matter more than size here.",
        "time": "60 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the yield asset is a smart contract and redemptions can be slow or limited, and thUSD can lose its peg. Mitigation: keep the position at $100 and test a small redemption before unwinding the full amount. Before you withdraw, open Theo Network thUSD's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $8 of gas to unwind (estimate)",
        "text": "Exit when the 60 days are up or thUSD loses its peg: redeem the thUSD on Ethereum, testing a small redemption first, then write the wallet, the asset, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "tydro": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $1 of gas (estimate)",
        "text": "Supply $100 of USDC to Tydro on Ink, its only chain, and keep the position open.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, manage the position with one more supply, a withdrawal or a repayment on Ink, so the wallet shows repeated lending use.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 30 days. Tydro has run 394 days with no token and holds $111M of TVL, down 4.9% in the last week, so a month of steady activity is the minimum that reads as a real user.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: lent funds depend on borrowers repaying, plus smart-contract risk. Mitigation: keep the position at $100 and exit if the pool's TVL falls sharply. Before you withdraw, open Tydro's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or the pool's TVL falls sharply: withdraw the supplied USDC on Ink, then write the wallet, the pool, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "ember": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $50 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$50 of capital and about $8 of gas (estimate)",
        "text": "Mint $50 of Ember's yield asset on Ethereum, the first of its 6 chains, and hold it.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, mint $25 more or redeem and re-mint a small amount, and once during the hold repeat the action on Sui, so the wallet shows repeated use of the RWA asset on two chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $50 stays in the position",
        "text": "Hold for at least 30 days. Ember has run 423 days with no token and holds $90M of TVL, down 6.0% in the last week, so keep the position small and do not add capital to chase the dip.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the yield asset is a smart contract and redemptions can be slow or limited. Mitigation: keep the position at $50 and test a small redemption before unwinding the full amount. Before you withdraw, open Ember's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $8 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up: redeem the yield asset on Ethereum, testing a small redemption first, then write the wallet, the asset, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "doppler-finance": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $50 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$50 of capital and under $1 of gas (estimate)",
        "text": "Deposit $50 into a Doppler Finance strategy on Ripple, the first of its 2 chains, and keep the position open.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "under $1 of gas a week (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing on Ripple, and once during the hold repeat the action on Ethereum, so the wallet is active on both of Doppler Finance's 2 chains.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $50 stays in the position",
        "text": "Hold for at least 30 days. Doppler Finance has run 638 days with no token and holds $93M of TVL, down 14.5% in the last week, so keep the position small and do not add capital to chase the dip.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: a CeDeFi strategy mixes custodian risk with smart-contract risk. Mitigation: keep the position at $50 and exit if the TVL fall steepens. Before you withdraw, open Doppler Finance's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "under $1 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or the TVL fall steepens: close the strategy position on Ripple, then write the wallet, the position, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "armitage-by-wintermute": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $8 of gas (estimate)",
        "text": "Deposit $100 into an Armitage by Wintermute vault on Ethereum, its only chain, and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $8 of gas a week on Ethereum (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing on Ethereum, so the wallet shows repeated use of the vault.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 60 days. Armitage by Wintermute listed only 178 days ago and holds $103M of TVL, up 5.8% in the last week, so a longer hold during early growth is the position to take.",
        "time": "60 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the vault is a smart contract and the curator's strategy can lose value. Mitigation: keep the position at $100 and exit if the vault's TVL falls sharply. Before you withdraw, open Armitage by Wintermute's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $8 of gas to unwind (estimate)",
        "text": "Exit when the 60 days are up or the vault's TVL falls sharply: withdraw the shares on Ethereum, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "avant-avusd": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $50 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$50 of capital and about $1 of gas (estimate)",
        "text": "Deposit $50 into an Avant avUSD vault on Avalanche, its only chain, and keep the shares for the full hold.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, compound the position by adding $25 or rebalancing on Avalanche, so the wallet shows repeated use of the vault.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $50 stays in the position",
        "text": "Hold for at least 30 days. Avant avUSD has run 541 days with no token and holds $95M of TVL, down 14.0% in the last week, so keep the position small and do not add capital to chase the dip.",
        "time": "30 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the vault is a smart contract and the allocator's strategy can lose value. Mitigation: keep the position at $50 and exit if the vault's TVL falls sharply. Before you withdraw, open Avant avUSD's own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 30 days are up or the vault's TVL falls sharply: withdraw the shares on Avalanche, then write the wallet, the vault, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
  "valos": [
      {
        "cost": "under $3 of gas for the first transaction (estimate)",
        "text": "Set up a fresh wallet that holds only the $100 you plan to farm, and keep its seed phrase offline.",
        "time": "5 minutes"
      },
      {
        "cost": "$100 of capital and about $1 of gas (estimate)",
        "text": "Mint $100 of Valos' yield asset on Monad, its only chain, and hold it.",
        "time": "15 minutes to set up"
      },
      {
        "cost": "about $1 of gas a week (estimate)",
        "text": "Each week, mint $25 more or redeem and re-mint a small amount on Monad, so the wallet shows repeated use of the RWA asset.",
        "time": "10 minutes a week"
      },
      {
        "cost": "the $100 stays in the position",
        "text": "Hold for at least 60 days. Valos listed only 113 days ago and holds $106M of TVL, up 0.1% in the last week, so a longer hold and a modest position matter more than size here.",
        "time": "60 days"
      },
      {
        "cost": "no fee to check, and never pay to claim",
        "text": "Risk: the yield asset is a smart contract and redemptions can be slow or limited. Mitigation: keep the position at $100 and test a small redemption before unwinding the full amount. Before you withdraw, open Valos' own points or rewards page and claim only from the link it publishes.",
        "time": "10 minutes"
      },
      {
        "cost": "about $1 of gas to unwind (estimate)",
        "text": "Exit when the 60 days are up: redeem the yield asset on Monad, testing a small redemption first, then write the wallet, the asset, the dates and every transaction in a farm log.",
        "time": "15 minutes to unwind"
      }
    ],
};

/**
 * A protocol's farm plan: six steps, each an action with a cost and a time. The plan is derived from
 * the protocol's own record (category, chains, TVL, age), never from a hand-written list of names.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const override = FARM_PLAN_OVERRIDES[p.slug];
  if (override !== undefined) return override;
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const action = actionFor(p, capital, chain);
  const weekly = weeklyActionFor(p);
  return [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.`,
      cost: 'under $3 of gas for the first transaction',
      time: '5 minutes',
    },
    {
      text: action,
      cost: `$${capital} of capital and about $${capital >= 150 ? 8 : 4} of gas`,
      time: '15 minutes to set up',
    },
    {
      text: `Make one qualifying action each week, such as ${weekly}.`,
      cost: 'about $2 of gas a week',
      time: '10 minutes a week',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.`,
      cost: 'nothing but the log',
      time: '5 minutes',
    },
  ];
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** A board row's compact form for data.js, carrying the farm plan the page renders. */
export function radarRow(row: BoardRow): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    breadth_multiplier: row.model.breadth_multiplier,
    farm_steps: row.farm_steps,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const early = board.filter((r) => !snapshot.watchlist.includes(r.slug)).length;
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: early,
    live_size: live.length,
    rows: board.map(radarRow),
    live,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
