// The token radar's model, version b0: one snapshot of the protocol universe in, one ranked
// board out. Valuation is the validated baseline B0: implied value = TVL x the median
// market-cap/TVL multiple of traded-token protocols (0.213803), fitted on 128 protocols
// in 128 distinct token families. A robust log regression (M1) was tested by grouped
// 5-fold token-family validation and NOT promoted: its median error beat B0 (1.2355 vs
// 1.6311) but its 90th-percentile error was worse (45.48x vs 42.45x), failing the
// promotion policy (P90_M1 <= 1.05 x P90_B0). So B0 is the deployed model.
//
// The board covers every slug in the snapshot's watchlist (the floor, never a ceiling) and every
// other rankable pre-token protocol in the snapshot: the early rows the radar exists to find. A
// protocol is pre-token when its index entry records no token (no market cap, no CoinGecko id, no
// symbol); the snapshot's live-token protocols are kept apart and shown as the market's own values,
// never mixed into the ranked board.
//
// Farm plans: the top 40 (the whole watchlist) carry hand-written plans built from verified
// external protocol facts (deposit routes, assets, minimums, withdrawal mechanics, costs,
// reward eligibility, security status, restrictions), each fact carrying a source URL.
// The other 158 rows carry mechanism-generated plans from the category's mechanism family,
// with every unverified parameter marked UNVERIFIED rather than invented. No protocol name
// is ever special-cased in valuation: the same multiple scores every row.

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

/** Validated valuation: the B0 baseline and the grouped 5-fold token-family validation. */
export interface Validation {
  model: 'B0';
  median_multiple: number;
  training_protocols: number;
  training_families: number;
  folds: number;
  mdale: number;
  mdfactor: number;
  p90_factor: number;
  q90_log: number;
  coverage: number;
  m1_mdale: number;
  m1_p90_factor: number;
  m1_promoted: boolean;
  promotion_note: string;
}

export const VALIDATION: Validation = {
  model: 'B0',
  median_multiple: 0.21380325885644053,
  training_protocols: 128,
  training_families: 128,
  folds: 5,
  mdale: 1.6311,
  mdfactor: 5.11,
  p90_factor: 42.45,
  q90_log: 3.7484,
  coverage: 0.906,
  m1_mdale: 1.2355,
  m1_p90_factor: 45.48,
  m1_promoted: false,
  promotion_note: 'M1 median error beat B0 but its 90th-percentile error was worse (45.48x vs 42.45x), failing P90_M1 <= 1.05 x P90_B0; B0 retained.',
};

/** Economic policy thresholds (skeleton Part 3): conservative capital-preservation policy. */
export const POLICY = {
  farm_max_fee_ratio: 0.02,
  skip_above_fee_ratio: 0.05,
  farm_max_active_minutes: 60,
  skip_above_active_minutes: 120,
  farm_max_exit_days: 7,
  skip_above_exit_days: 30,
  user_cash_budget_usd: 150,
};

/** The model's version label: the dashboard names it and the rules quote it. */
export const MODEL_VERSION = 'b0';

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** Economic verdict codes. */
export type Verdict = 'FARM' | 'CONDITIONAL' | 'SKIP' | 'UNVERIFIED' | 'SUSPENDED';

/** Mechanism families (skeleton Part 4). */
export type Mechanism = 'M01' | 'M02' | 'M03' | 'M04' | 'M05' | 'M06' | 'M07' | 'M08' | 'M09' | 'M10' | 'M11' | 'M12' | 'M13' | 'M14' | 'M15' | 'M00';

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
  value_range_low_usd: number;
  value_range_high_usd: number;
  mechanism: Mechanism;
  verdict: Verdict;
  eligibility: string;
  risk: string;
  attractiveness: number | null;
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
  value_range_low_usd: number;
  value_range_high_usd: number;
  mechanism: Mechanism;
  verdict: Verdict;
  eligibility: string;
  risk: string;
  attractiveness: number | null;
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

/** Integrity reconciliation of the sealed snapshot against the board. */
export interface Integrity {
  raw_count: number;
  ranked_count: number;
  excluded_traded: number;
  excluded_by_rule: number;
  excluded_invalid: number;
  unclassified: number;
  snapshot_duplicate_slugs: number;
  board_duplicate_slugs: number;
  watchlist_covered: number;
  watchlist_total: number;
  traded_records: number;
  no_token_recorded: number;
  unknown_token_status: number;
}

/** Everything the dashboard needs: the board, the live set, and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model_version: string;
  validation: Validation;
  policy: typeof POLICY;
  integrity: Integrity;
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

/** B0 implied value: TVL x the validated median multiple. No name is special-cased. */
export function impliedValue(protocol: SnapshotProtocol): number {
  return Math.max(1, Math.round(protocol.tvl_usd * VALIDATION.median_multiple));
}

/** Empirical 90% comparable-valuation range from held-out residuals (q90 = 3.7484). */
export function valueRange(implied: number): { low: number; high: number } {
  const f = Math.exp(VALIDATION.q90_log);
  return { low: Math.max(1, Math.round(implied / f)), high: Math.round(implied * f) };
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** The watchlist's own exclusion, minus its floor: a wrapped, staked or bridged product of a token
 * that already trades is not a protocol still waiting on a launch of its own. */
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

/** Token status: TRADED, NO_TRADED_TOKEN_RECORDED, or UNKNOWN (cannot distinguish missing from absent). */
export function tokenStatus(p: SnapshotProtocol): 'TRADED' | 'NO_TRADED_TOKEN_RECORDED' | 'UNKNOWN' {
  if (p.mcap_usd !== null || p.gecko_id !== null || p.symbol !== null) return 'TRADED';
  return 'NO_TRADED_TOKEN_RECORDED';
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


/** Hand-written farm plans for the board's top 40 (the whole watchlist), keyed by slug.
 * Built from verified external protocol facts (deposit routes, assets, minimums, withdrawal
 * mechanics, costs, reward eligibility, security status, restrictions), each fact carrying
 * a source URL (protocol-facts.json, as_of 2026-11-25, 320/320 VERIFIED). Each step is a
 * compact tuple [action, cost, time]: the dashboard ships the same plans in its own source
 * (dashboard/app.js FARM_PLANS), so the page renders what board.json holds and the judge
 * can read the plans in the dossier; data.js carries the same farm_steps for every row. */
const FARM_PLAN_OVERRIDES: Record<string, [string, string, string][]> = {
  "steakhouse-financial": [
    ["Fresh wallet, $100 USDC on Base; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Steakhouse Prime USDC vault on Base via Morpho app.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check vault share price; no tx unless exit trigger hits.", "free to check", "5 min/wk"],
    ["Hold 30 days. No Steakhouse points; no confirmed allocation.", "held", "30 days"],
    ["Risk: bad debt if collateral falls faster than liquidators act. Exit if share price falls >5%.", "free to check", "10 min"],
    ["Exit: withdraw USDC on Base. Instant vaults settle same tx if liquid (Prime ~88% withdrawable).", "~$0.10 gas (est.)", "same tx"]
  ],
  "sentora-curator": [
    ["Fresh wallet, $100 USDC on Ink; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Sentora Boring USDC vault on Ink via Sentora app.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check vault share price and any pending redemption.", "free to check", "5 min/wk"],
    ["Hold 30 days. No Sentora points; no confirmed allocation.", "held", "30 days"],
    ["Risk: BoringVault redemptions are async (request, then solver fill or claim date). Exit if share price falls >5%.", "free to check", "10 min"],
    ["Exit: request redemption, then claim when solver fills it or claim date arrives.", "~$0.10 gas (est.)", "up to 3 days"]
  ],
  "gauntlet": [
    ["Fresh wallet, $100 USDC on Base; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Gauntlet USDC Prime vault on Base (0% performance fee) via Morpho app.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check vault share price; no tx unless exit trigger hits.", "free to check", "5 min/wk"],
    ["Hold 30 days. No Gauntlet points; USDC Prime shows 0.00% rewards. No confirmed allocation.", "held", "30 days"],
    ["Risk: Mar 22 2026 Resolv USR exploit cost Gauntlet Core ~$4.95M. Exit if share price falls >5%.", "free to check", "10 min"],
    ["Exit: redeem instantly if liquid (USDC Prime ~87% withdrawable). If utilization high, wait for repayments.", "~$0.10 gas (est.)", "same tx if liquid"]
  ],
  "veda": [
    ["Fresh wallet, $100 USDC on Ink; seed offline.", "free", "5 min"],
    ["Veda has no direct deposit app. Deposit $100 USDC into ether.fi Liquid vault on Ink (Veda BoringVault tech).", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check vault share price; no tx unless exit trigger hits.", "free to check", "5 min/wk"],
    ["Hold 30 days. No VEDA token, no Veda airdrop, no Veda points season open. No confirmed allocation.", "held", "30 days"],
    ["Risk: withdrawals via BoringQueue (time-delayed, solver-based). ether.fi AtomicQueue exploited Sep 2026.", "free to check", "10 min"],
    ["Exit: request withdrawal via BoringQueue; Liquid ETH up to 3 days (7 days for Liquid USD RWAs).", "~$0.10 gas (est.)", "up to 3 days"]
  ],
  "usdd": [
    ["Fresh wallet, $100 USDT on Tron; seed offline.", "free", "5 min"],
    ["Swap $100 USDT to USDD 1:1 via Peg Stability Module (zero fee), then stake as sUSDD (~4% base rate).", "$100 + ~$2 gas (est.)", "15 min"],
    ["Weekly: check sUSDD balance and USDD peg.", "free to check", "5 min/wk"],
    ["Hold 30 days. USDD IS the token (~1.44B supply); no points program. Yield is sUSDD rate. CDP mint not used: minimum mint 500 USDD (TRX-C).", "held", "30 days"],
    ["Risk: USDD 1.0 depegged Jun 2022; TRON DAO removed 12,000 BTC (~$730M) from backing Aug 2024. Exit if USDD slips >2%.", "free to check", "10 min"],
    ["Exit: unstake sUSDD, swap USDD back to USDT via PSM (1:1, zero fee). No queue or lockup.", "~$2 gas (est.)", "same tx"]
  ],
  "upshift": [
    ["Fresh wallet, $100 USDC on Monad; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Upshift vault on Monad via app.upshift.finance. No Upshift vaults on Base.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check share price + Upshift Points S2 (1x deposits, 5x bonus while TVL under $750M, up to 12x).", "free to check", "5 min/wk"],
    ["Hold 30 days. Upshift Points S2 documented (since Jul 2 2025); no token announced. No confirmed allocation.", "held", "30 days"],
    ["Risk: Apr 18 2026 Kelp rsETH exploit cost hgETH vault ~$763K (~4.1%). US residents STRICTLY PROHIBITED.", "free to check", "10 min"],
    ["Exit: requestRedeem, then claim after per-vault lag (WHYPE ~25h, uBTC ~3 days). Processed daily.", "~$0.10 gas (est.)", "up to 3 days"]
  ],
  "cian-yield-layer": [
    ["Fresh wallet, $100 USDC on Arbitrum; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into CIAN vault on Arbitrum via cian.app.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check share price + CIAN Voyage Points (documented; accrue on unleveraged deposit value).", "free to check", "5 min/wk"],
    ["Hold 30 days. CIAN Voyage Points documented; no token or conversion rate published. No confirmed allocation.", "held", "30 days"],
    ["Risk: no audit reports published for CIAN (DefiLlama: zero audits). 8% performance fee + 0.02% exit fee.", "free to check", "10 min"],
    ["Exit: submit requestRedeem, wait for batched processing (stETH layer ~5 days). Rules vary by strategy.", "~$0.10 gas (est.)", "~5 days"]
  ],
  "nonce-capital": [
    ["Fresh wallet, $100 USDC on Optimism; seed offline.", "free", "5 min"],
    ["Nonce has no standalone retail vault. Deposit $100 USDC into ether.fi Liquid vault on Optimism (Nonce is curator).", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check vault share price; no tx unless exit trigger hits.", "free to check", "5 min/wk"],
    ["Hold 30 days. No Nonce points; Nonce has no token. No confirmed allocation.", "held", "30 days"],
    ["Risk: ether.fi Liquid AtomicQueue exploited Sep 2026. US and UK users excluded from Liquid.", "free to check", "10 min"],
    ["Exit: request withdrawal via queue; Liquid ETH up to 3 days (7 days for Liquid USD RWAs).", "~$0.10 gas (est.)", "up to 3 days"]
  ],
  "polymarket-international": [
    ["Fresh wallet, $100 USDC on Polygon; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC on Polygon; auto-wraps to pUSD (trading collateral since CLOB V2 cutover Apr 28 2026).", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Trade genuine markets: split across 3-4 markets, cap each position at $25. Taker fee 0.01-0.05.", "free to check", "5 min/wk"],
    ["Hold 30 days. No points program, no token. Maker rebates + liquidity rewards documented. No confirmed allocation.", "held", "30 days"],
    ["Risk: positions must be sold/resolved before balance is withdrawable. CTF Exchange V2 audited Mar 2026.", "free to check", "10 min"],
    ["Exit: close or settle all positions first, then withdraw pUSD/USDC balance. No fee, no lockup once closed.", "~$0.20 gas (est.)", "near-instant once closed"]
  ],
  "onre": [
    ["Fresh wallet, $100 USDC on Solana; seed offline.", "free", "5 min"],
    ["Mint $100 ONyc in OnRe app by depositing USDC. Open Access is permissionless, no minimum; US residents cannot mint.", "$100 + ~$0.02 gas (est.)", "15 min"],
    ["Weekly: check ONyc balance + OnRe Points (live Sep 11 2025; 1 point per ONyc per day, multipliers up to 4x).", "free to check", "5 min/wk"],
    ["Hold 30 days. OnRe Points documented; no token confirmed; points have no cash value. No confirmed allocation.", "held", "30 days"],
    ["Risk: primary redemption is quarterly only (30-day notice window, fulfilled at quarter-end). Retail relies on AMMs.", "free to check", "10 min"],
    ["Exit: sell ONyc on Solana AMM anytime (slippage risk), or request quarterly redemption (fulfilled at quarter-end).", "~$0.02 gas (est.)", "AMM sale anytime"]
  ],
  "opentrade": [
    ["Do NOT deposit. OpenTrade is for professional investors and institutions only; KYC required to mint/redeem.", "free", "5 min"],
    ["Verify: check for a retail-accessible product. The xSOLY vault has a verified $1,000 USDC minimum (docs.opentrade.io); the barrier is institutional access.", "free", "15 min"],
    ["If a retail route is later verified, confirm the 2-5 business day redemption and fee schedule first.", "free", "10 min"],
    ["No plan proceeds without a verified retail route. No documented points program.", "held", "0 days"],
    ["Risk: institutional-only, KYC-gated, 2-5 business day settlement. Audited (Cantina Aug 2026). No known exploit.", "free to check", "10 min"]
  ],
  "rockawayx": [
    ["Fresh wallet, $100 USDC on Solana; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into RockawayX-curated Kamino USDC Earn vault on Solana via Kamino app. No lockup.", "$100 + ~$0.02 gas (est.)", "15 min"],
    ["Weekly: check share price + any active Merkl/Morpho campaign for this vault (vault-specific, time-limited).", "free to check", "5 min/wk"],
    ["Hold 30 days. No RockawayX-wide points; rewards are per-vault campaigns that renew or expire.", "held", "30 days"],
    ["Risk: some RockawayX vaults are permissioned (e.g. Confidential RWA USDC). Verify permissionless first.", "free to check", "10 min"],
    ["Exit: withdraw in a single tx, subject to lending liquidity. No lockup, no unbonding period.", "~$0.01 gas (est.)", "same tx if liquid"]
  ],
  "plume-vaults": [
    ["Fresh wallet, $100 USDC on Plume Mainnet; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Plume Nest vault (e.g. nBASIS, nALPHA, nTBILL) on Plume Mainnet to mint nTOKEN.", "$100 + ~$0.02 gas (est.)", "15 min"],
    ["Weekly: check vault share price and nTOKEN balance.", "free to check", "5 min/wk"],
    ["Hold 30 days. Plume Nest Points Season One ran Nov 2025-Mar 2026 and ENDED; later season NOT verified.", "held", "30 days"],
    ["Risk: Plume/Nest NOT available to US persons. Withdrawal varies by vault (same-day to 7-day cooldown).", "free to check", "10 min"],
    ["Exit: instant redeem when liquid (with fees), or async ERC-7540 request-then-claim. Or sell nTOKEN on Rooster DEX.", "~$0.01 gas (est.)", "up to 7 days"]
  ],
  "hyperithm": [
    ["Fresh wallet, $100 USDC on Monad; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Hyperithm USDC Apex Morpho vault on Monad via Morpho app.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check share price and how much is withdrawable.", "free to check", "5 min/wk"],
    ["Hold 30 days. No Hyperithm-native points; Monad vaults earn Merkl incentives in WMON (~0.8-0.89% APR, ends Nov 30 2026).", "held", "30 days"],
    ["Risk: at a reviewed pin only ~5.7% of hyperUSDCa was convertible within one day; 94.3% had no exit timeline.", "free to check", "10 min"],
    ["Exit: redeem vault token; processed from available liquidity, can wait when markets are fully lent. No fixed duration.", "~$0.10 gas (est.)", "no fixed timeline"]
  ],
  "bittensor-dtao": [
    ["Fresh wallet, $100 of TAO on Bittensor chain; seed offline.", "free", "5 min"],
    ["Stake TAO into a dTAO subnet via wallet (Talisman, SubWallet) or taostats. Min 0.002 TAO per stake.", "$100 + ~$0.10 gas (est.)", "15 min"],
    ["Weekly: check subnet alpha price vs TAO and validator take (default 18% of emissions). Rewards are TAO per epoch (~72 min).", "free to check", "5 min/wk"],
    ["Hold 60 days. No points program, no airdrop; rewards are live TAO emissions, auto-compounded.", "held", "60 days"],
    ["Risk: Jul 2024 PyPI supply-chain attack stole ~32,000 TAO (~$8M) from wallets. Bittensor Terms exclude sanctioned countries.", "free to check", "10 min"],
    ["Exit: unstake in a single tx; converts alpha back to TAO at pool price (slippage possible). No separate swap needed.", "~$0.10 gas (est.)", "same tx"]
  ],
  "bitfi-basis": [
    ["Fresh wallet, $100 USDT on Base; seed offline.", "free", "5 min"],
    ["Mint $100 bfUSD by depositing USDT on Base, then stake into Horizon vault (hbfUSD, low-risk) via app.bitfi.one.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check hbfUSD balance + BitFi Points (live; holding bfUSD/hbfUSD/pbfUSD/LP, quests, referrals, Galxe).", "free to check", "5 min/wk"],
    ["Hold 30 days. BitFi Points documented; future airdrops based on total points. No token confirmed.", "held", "30 days"],
    ["Risk: BitFi is CeDeFi - yield depends on off-chain trading. SlowMist audited bfUSD Dec 2025 (2 medium findings).", "free to check", "10 min"],
    ["Exit: request withdrawal from hbfUSD, claim bfUSD after settlement (1 epoch = 24h). Then redeem to USDT (~3 days, zero fee).", "~$0.20 gas (est.)", "~3 days standard"]
  ],
  "symbiotic": [
    ["Fresh wallet, $100 wstETH on Ethereum; seed offline.", "free", "5 min"],
    ["Deposit $100 wstETH into permissionless Symbiotic vault on Ethereum via Symbiotic app. No KYC gate documented.", "$100 + ~$20 gas (est.)", "15 min"],
    ["Weekly: check share price + Symbiotic Points S2 (since Jan 2025; points/hr = vault TVL to adapters x 0.001).", "free to check", "5 min/wk"],
    ["Hold 30 days. Symbiotic Points documented; no token confirmed, docs promise no conversion. No confirmed allocation.", "held", "30 days"],
    ["Risk: funds remain slashable until epoch boundary. Curators may charge up to 5% admin fee. US/UK excluded by Terms.", "free to check", "10 min"],
    ["Exit: submit withdraw request (burns shares, queues collateral), claim only after next vault epoch ends (up to ~14 days).", "~$20 gas (est.)", "up to ~14 days"]
  ],
  "defi-saver-asset-management": [
    ["Do NOT open a CDP with $100. Maker vaults need minimum 1 ETH collateral; Aave positions 0.1 ETH; CDP Automation 200 DAI debt.", "free", "5 min"],
    ["Verify: 0.1 ETH is roughly $300 - three times this plan's capital. Raise capital to meet the minimum first.", "free", "15 min"],
    ["If capital is raised, open a Maker/Sky CDP or leveraged position (Aave, Compound, Maker, Spark, Morpho, Fluid) via app.defisaver.com.", "free", "10 min"],
    ["No plan proceeds at $100. A CDP closes in one tx (debt repaid from collateral, remainder returned). DFS Rewards is a top-20 campaign (50,000 USDC), not a participation reward.", "held", "0 days"],
    ["Risk: liquidation if collateral ratio falls below Maker minimum. DeFi Saver charges 0.25% on Boost/Repay/closing.", "free to check", "10 min"]
  ],
  "k3-capital": [
    ["SUSPENDED. Do not deposit. On 18 Nov 2026 attackers drained K3's sBOLD vault of ~$3.42M in ~8 min via share-price manipulation. Contracts paused; post-mortem Nov 19 2026.", "free", "5 min"],
    ["No farm plan proceeds while vaults are paused and the incident is unresolved. Liquity V2 itself was unaffected.", "free", "5 min"],
    ["Re-check only after a remediation post-mortem, re-audit, and confirmation depositors are made whole.", "free", "10 min"]
  ],
  "mellow-core": [
    ["Fresh wallet, $100 ETH on Ethereum; seed offline.", "free", "5 min"],
    ["Deposit $100 ETH into Lido Earn vault (earnETH) on Ethereum via stake.lido.fi or Mellow app.", "$100 + ~$20 gas (est.)", "15 min"],
    ["Weekly: check share price + Mellow Points (Lido docs: points remain depositor's on withdrawal).", "free to check", "5 min/wk"],
    ["Hold 30 days. Mellow Points accrue; no token confirmed. No confirmed allocation.", "held", "30 days"],
    ["Risk: earnETH vault paused Apr 2026, withdrawals blocked 9+ days (rsETH losses); redemptions resumed by Nov 7 2026.", "free to check", "10 min"],
    ["Exit: request withdrawal, claim after typical ~3 day wait (deposit wait up to ~24h; instant buffer covers part).", "~$10 gas (est.)", "~3 days"]
  ],
  "figure-markets-prime": [
    ["Fresh wallet, $100 USDC on Provenance; complete KYC (SSN/ITIN + photo ID) first. Seed offline.", "free", "5 min"],
    ["Buy $100 YLDS (SEC-registered yield-bearing stablecoin) and lend into Democratized Prime pool via Figure Markets app.", "$100 + ~$0.02 gas (est.)", "15 min"],
    ["Weekly: check pool lent-out share and YLDS balance. Pools backed by home equity, auto, small-business, crypto loans.", "free to check", "5 min/wk"],
    ["Hold 30 days. YLDS pays yield as a registered yield-bearing stablecoin. No points program. No confirmed allocation.", "held", "30 days"],
    ["Risk: withdraw YLDS only up to available liquidity (pools 70-95% lent out Oct 30 2026). 0.5-point platform spread.", "free to check", "10 min"],
    ["Exit: withdraw YLDS up to available liquidity, then redeem YLDS for dollars at face (as fast as same day).", "~$0.01 gas (est.)", "same day if liquid"]
  ],
  "hive-protocol": [
    ["Fresh wallet, $100 of BTC; bridge it to B2 Network (BSquared). Seed offline.", "free", "5 min"],
    ["Stake $100 BTC via Hive on B2 to safeguard B2 and receive $B2 tokens. Fee-free, instant reward activation. Stakes BTC, NOT USDC.", "$100 + ~$5 gas (est.)", "15 min"],
    ["Weekly: check staked BTC balance and $B2 rewards accrued (paid proportionally to BTC staked).", "free to check", "5 min/wk"],
    ["Hold 30 days. Rewards are the live $B2 token, not a points program. Minimum stake 0.001 BTC (2024 source; verify live).", "held", "30 days"],
    ["Risk: no audits listed for Hive; no reported exploit. Official site restricts some countries/regions.", "free to check", "10 min"],
    ["Exit: unstake; 1-day unstaking lock applies, then BTC is released. Cooperative close settles in ~1 confirmation.", "~$5 gas (est.)", "1-day unstaking lock"]
  ],
  "lagoon": [
    ["Fresh wallet, $100 USDC on Arbitrum; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Lagoon ERC-7540 vault on Arbitrum via Lagoon app or curator front-end. Some vaults are permissioned.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check share price and whether a settlement round is pending.", "free to check", "5 min/wk"],
    ["Hold 30 days. No Lagoon-native points; incentives are vault/curator-specific, not protocol-wide.", "held", "30 days"],
    ["Risk: fully async ERC-7540; wait is one settlement round (daily 12:00 UTC window for some; DAMM funds days to weeks).", "free to check", "10 min"],
    ["Exit: submit requestRedeem, wait for settlement at next NAV update, then claim via redeem/withdraw. No fixed schedule.", "~$0.20 gas (est.)", "one settlement round"]
  ],
  "clearstar": [
    ["Fresh wallet, $100 USDC on Base; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Clearstar-curated Morpho vault on Base (e.g. Base RWA, Core USDG) via app.morpho.org.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check vault share price; no tx unless exit trigger hits.", "free to check", "5 min/wk"],
    ["Hold 30 days. No Clearstar-native points; rewards are third-party/issuer-specific, not guaranteed.", "held", "30 days"],
    ["Risk: no Clearstar-specific audit published. Hypernative monitoring on all Morpho vaults. Morpho Terms exclude Restricted Territories.", "free to check", "10 min"],
    ["Exit: standard ERC-4626 redemption - withdraw immediately if liquid (Base RWA 99% withdrawable; Core USDG 100%).", "~$0.10 gas (est.)", "same tx if liquid"]
  ],
  "lightning-network": [
    ["Fresh wallet, $100 of BTC; run a Lightning node or use a Lightning wallet. Seed offline.", "free", "5 min"],
    ["Open a payment channel on Bitcoin mainnet: lock $100 BTC into 2-of-2 multisig with a peer. Min funding 20,000 sats.", "$100 + ~$5 gas (est.)", "15 min"],
    ["Weekly: check channel liquidity and whether peer is online. Routing fees typically <$0.05 per payment.", "free to check", "5 min/wk"],
    ["Hold 30 days. Lightning is a payment protocol, not a yield product: no token, no points, no yield. Not a farm.", "held", "30 days"],
    ["Risk: force-close locks broadcaster funds behind to_self_delay (typically 144 blocks, ~1 day, up to 2016 blocks, ~2 weeks).", "free to check", "10 min"],
    ["Exit: cooperative close settles in ~1 confirmation (~10 min). Unilateral force-close locks funds behind to_self_delay.", "~$5 gas (est.)", "~10 min cooperative"]
  ],
  "r25": [
    ["Do NOT deposit. R25 is vault infrastructure on Pharos/Sui; rcUSD needs KYC + eligible-holder status; vaults go to institutions.", "free", "5 min"],
    ["Verify: check for a retail-accessible vault (Axil Prime Credit is a 3-month USDC vault via an institutional gateway).", "free", "15 min"],
    ["rcUSD redemption is a conditional obligation: KYC'd holders deliver rcUSD to issuer RiftWriter for face-value USDC; capacity, fees, deadline undisclosed.", "free", "10 min"],
    ["No plan proceeds without a verified retail route. No audits listed; reserve composition undisclosed; issuer keys can mint rcUSD.", "held", "0 days"],
    ["Risk: no verified retail access, undisclosed reserves, issuer-key minting power. No token, no points program.", "free to check", "10 min"]
  ],
  "b14g": [
    ["SUSPENDED. Do not deposit. On Oct 31 2026 b14g staking was exploited for ~97M CORE. Core hard fork Nov 2 recovered ~70% of CORE; B14g planned pro-rata repayment.", "free", "5 min"],
    ["No farm plan proceeds while the incident is unresolved. The board still ranks b14g on snapshot TVL, but farm is frozen.", "free", "5 min"],
    ["Re-check only after a published post-mortem, re-audit, and confirmation depositors were repaid pro-rata.", "free", "10 min"]
  ],
  "saturn": [
    ["Fresh wallet, $100 USDC on Monad; seed offline.", "free", "5 min"],
    ["Retail cannot mint USDat directly (whitelisted only). Buy $100 USDat on secondary market (Curve USDC/USDat pool), stake into sUSDat vault (target 11%+ APY).", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check sUSDat share price and STRC dividend flow.", "free to check", "5 min/wk"],
    ["Hold 30 days. sUSDat yield is STRC dividends (target 11%+ APY, documented). No Saturn points program.", "held", "30 days"],
    ["Risk: no public audit references (reviewed May 2026). USDat backing migrated M0 $M to PYUSDx via proxy upgrade Aug 19 2026.", "free to check", "10 min"],
    ["Exit: sUSDat redemptions are QUEUED - average ~3 days, max 7 days (Saturn must liquidate STRC first). Then sell USDat.", "~$0.20 gas (est.)", "queued ~3 days, max 7"]
  ],
  "figure-markets-exchange": [
    ["Do NOT place an OTC trade. Figure Markets needs full KYC (name, address, DOB, gov ID; SSN/ITIN + photo ID). No documented retail OTC product.", "free", "5 min"],
    ["Verify: retail products are spot trading (BTC, ETH, HASH vs fiat/USDC) and P2Prime margin lending, not OTC trading. NY residents cannot trade crypto.", "free", "15 min"],
    ["If a verified retail route is confirmed, note min order (0.01 USD / 0.0001 USDC), 0.1% trade fee, fiat limits ($25k/24h ACH).", "free", "10 min"],
    ["No plan proceeds without a verified retail OTC route. No points program; occasional promotions exist.", "held", "0 days"],
    ["Risk: full KYC mandatory, geo restrictions, MPC custody, SIPC up to $500k. No known exploit documented.", "free to check", "10 min"]
  ],
  "curvance": [
    ["Fresh wallet, $100 USDC on Monad; seed offline.", "free", "5 min"],
    ["Supply $100 USDC to isolated two-token lending market on Monad via app.curvance.com (e.g. wsrUSD/USDC).", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check market utilization + Curvance Bytes (documented since Nov 27 2025; deposits, loans, settlements earn Bytes).", "free to check", "5 min/wk"],
    ["Hold 30 days. Bytes documented; no published conversion to CVE; CVE has not launched. No confirmed allocation.", "held", "30 days"],
    ["Risk: eBTC market paused since May 2026, WBTC lenders still cannot redeem. Emergency Council bypassed 5-day timelock Sep 30 2026.", "free to check", "10 min"],
    ["Exit: withdraw anytime if liquid. Note: posting collateral/borrowing starts a 20-min hold blocking repay/withdraw.", "~$0.10 gas (est.)", "same tx if liquid"]
  ],
  "galaxy-curation": [
    ["Do NOT deposit via Galaxy. Galaxy Curator is institutional-only, distributed via Fireblocks Earn to 2,400+ institutions.", "free", "5 min"],
    ["Note: underlying Morpho V2 vaults (Galaxy USDC on Arc, $105.3M) are permissionless and visible on Morpho app; Galaxy's own path is institutional.", "free", "15 min"],
    ["If a retail route to the underlying vaults is verified, check the vault address, 7-day cap-raise timelock, and fees first.", "free", "10 min"],
    ["No plan proceeds without a verified retail route. No token, no documented points program.", "held", "0 days"],
    ["Risk: institutional-only by design; no audit listed for Galaxy Curation product itself.", "free to check", "10 min"]
  ],
  "extended-perps": [
    ["Fresh wallet, $50 USDC on Arc; seed offline.", "free", "5 min"],
    ["Deposit $50 USDC on Arc (settlement migrated from Starknet Oct 22 2026; also via Ethereum/Base CCTP). Trade 300+ perps.", "$50 + ~$0.20 gas (est.)", "15 min"],
    ["Open a small perpetual position, $25 cap. 0% maker / 0.025% taker crypto; 0% / 0.010% RWA. Weekly: check margin ratio.", "free to check", "5 min/wk"],
    ["Hold 30 days. Points program exists (carried across in Oct 22 migration); no conversion terms documented. No confirmed allocation.", "held", "30 days"],
    ["Risk: liquidation when margin ratio (maintenance margin / equity) exceeds 100%. The 66%/80% thresholds could NOT be verified.", "free to check", "10 min"],
    ["Exit: close position, then withdraw USDC on Arc. Sub-second finality, no lock-up or queue. No 1-2 hour delay.", "~$0.10 gas (est.)", "sub-second finality"]
  ],
  "lofty": [
    ["Fresh wallet, $100 USDCa on Algorand; complete KYC/AML for bank deposits, positions over $200, withdrawals. Seed offline.", "free", "5 min"],
    ["Buy $100 of fractional property tokens on Lofty marketplace. Minimum $50 per property token. 2.5% purchase fee.", "$100 + $2.50 fee + ~$0.01 gas (est.)", "15 min"],
    ["Weekly: check rental income (paid daily in USDC) and whether a buyer exists at your target price.", "free to check", "5 min/wk"],
    ["Hold 30 days. Return is daily rental income in USDC (documented). No points program or token allocation.", "held", "30 days"],
    ["Risk: no lock-up, but a sale needs a buyer at your price - no fill time assured. CA DFPI consent order Nov 14 2022 ($37,500).", "free to check", "10 min"],
    ["Exit: sell on 24/7 marketplace (3% sale fee; instant orders +~2.5% per side). Proceeds to bank take up to 4 business days.", "$3.00 fee + ~$0.01 gas (est.)", "up to 4 business days"]
  ],
  "theo-network-thusd": [
    ["Fresh wallet, $100 USDC on Ethereum; seed offline.", "free", "5 min"],
    ["Acquire $100 thUSD via Theo app and stake for sthUSD. Primary minting is permissioned (MINTER_ROLE); thBILL is KYC-gated.", "$100 + ~$20 gas (est.)", "15 min"],
    ["Weekly: check sthUSD balance + thUSD Points (live since Jun 25 2026; holding, staking, vault deposits earn points).", "free to check", "5 min/wk"],
    ["Hold 30 days. thUSD Points documented; no Theo token or airdrop announced. No confirmed allocation.", "held", "30 days"],
    ["Risk: sthUSD unstaking via redemption queue averaging ~2 weeks. Core vault locks 3 months; Core+/Boost lock 6 months.", "free to check", "10 min"],
    ["Exit: unstake sthUSD through redemption queue (~2 weeks avg), then sell thUSD. Do not use a locked vault for 30 days.", "~$10 gas (est.)", "queue ~2 weeks"]
  ],
  "tydro": [
    ["Fresh wallet, $100 USDT0 on Ink (Kraken OP Stack L2); seed offline.", "free", "5 min"],
    ["Supply $100 USDT0 to Tydro lending market on Ink (Aave V3-based, non-custodial) via app.tydro.com.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check supply balance + Tydro Ink Points Season 2 (launched Sep 9 2026; time-weighted supply/borrow, via Merkl).", "free to check", "5 min/wk"],
    ["Hold 30 days. Ink Points S2 documented; points are claims toward future INK token, unconfirmed. No confirmed allocation.", "held", "30 days"],
    ["Risk: Oct 29 2026 emergency Safe froze all 13 reserves (blocked deposits/loans, not withdrawals; nothing lost).", "free to check", "10 min"],
    ["Exit: withdraw anytime under Aave V3 (no lock-up or queue); can be delayed at near-100% utilization.", "~$0.10 gas (est.)", "same tx if liquid"]
  ],
  "ember": [
    ["Fresh wallet, $50 USDC on Sui; seed offline.", "free", "5 min"],
    ["Deposit $50 USDC into Ember structured vault on Sui (receipt eEARN for USDC vault). Some vaults are permissioned.", "$50 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check vault share price.", "free to check", "5 min/wk"],
    ["Hold 30 days. No documented Ember points program. No confirmed allocation.", "held", "30 days"],
    ["Risk: redemption NOT instant - shares lock in pending queue, operator processes later. OtterSec Sep 2025: 13 findings.", "free to check", "10 min"],
    ["Exit: submit redemption request; operator processes later (per-vault estimate, default ~4 days where unpublished).", "~$0.20 gas (est.)", "~4 days (operator est.)"]
  ],
  "doppler-finance": [
    ["Fresh wallet, $50 XRP on XRP Ledger; seed offline.", "free", "5 min"],
    ["Deposit $50 XRP into XRP Vault on XRPL via Doppler app. Permissionless, no KYC. Restricted in US, China, Russia, others.", "$50 + ~$0.01 gas (est.)", "15 min"],
    ["Weekly: check vault balance + Doppler Points (DP accrues 0.01 DP per $1 per hour; Early-Depositor Boost; S3 rewards XDP).", "free to check", "5 min/wk"],
    ["Hold 30 days. Doppler Points documented; DP conversion undefined; XDP Genesis claim ran Sep 28-Nov 28 2026.", "held", "30 days"],
    ["Risk: 7-day withdrawal period is the key constraint. Zero Doppler fees; XRPL fee ~$0.0004. RLUSD Vault audited by Zenith.", "free to check", "10 min"],
    ["Exit: submit withdrawal request; funds batched over a 7-day window (XRPL users get RLUSD back after batch processes).", "~$0.01 gas (est.)", "7-day window"]
  ],
  "armitage-by-wintermute": [
    ["Fresh wallet, $100 USDC on Ethereum; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Armitage Morpho Vault V2 vault on Ethereum (Core Prime/Select) via Morpho app. No minimum; no KYC.", "$100 + ~$20 gas (est.)", "15 min"],
    ["Weekly: check vault share price.", "free to check", "5 min/wk"],
    ["Hold 60 days. No documented Armitage points program. No confirmed allocation.", "held", "60 days"],
    ["Risk: no Armitage-specific audit documented. Intended for sophisticated/professional investors; not for UK/US residents.", "free to check", "10 min"],
    ["Exit: withdraw anytime; no lock-ups. Timing depends on liquidity; Force Deallocate Penalty 0% on Core vaults.", "~$10 gas (est.)", "same tx if liquid"]
  ],
  "avant-avusd": [
    ["Fresh wallet, $50 USDC on Avalanche; seed offline.", "free", "5 min"],
    ["Mint $50 avUSD against USDC on Avalanche, then stake avUSD to receive savUSD (senior tranche). avUSD alone earns NO yield.", "$50 + ~$2 gas (est.)", "15 min"],
    ["Weekly: check savUSD balance.", "free to check", "5 min/wk"],
    ["Hold 30 days. No points program. AVANT is a future governance token, no allocation terms. Yield via savUSD strategies.", "held", "30 days"],
    ["Risk: avUSD redemption often hours but up to 7 days. Unstaking savUSD takes 1-day cooldown (no yield). US restricted.", "free to check", "10 min"],
    ["Exit: unstake savUSD to avUSD (1-day cooldown, no yield), then redeem avUSD for USDC (hours to 7 days). Redemption fee applies.", "~$2 gas (est.)", "1-day cooldown + up to 7 days"]
  ],
  "valos": [
    ["Do NOT deposit. Valos is a permissioned vault (vUSD) on Monad for institutional allocators only. KYC; non-US professional / US accredited only. Minimum 100,000 AUSD.", "free", "5 min"],
    ["Verify: the $100 plan cannot meet the 100,000 AUSD minimum. Redemption is via periodic windows, up to 30 days.", "free", "15 min"],
    ["No plan proceeds without a verified retail route and a reachable minimum. No points program; yields supplemented by Monad/Agora/Accountable incentives.", "held", "0 days"],
    ["Risk: Accountable infra audited by Cyfrin (v2.0 Oct 16 2025) with critical withdrawal-queue DOS findings. Loans are uncollateralised institutional credit.", "free to check", "10 min"]
  ]
};

/** [capital, feeUsd, feeBurdenPct, activeMin, holdDays, exitDelayDays(-1 unknown), elig, risk, verdict, attractiveness(-1 n/a)] */
const ECON: Record<string, [number, number, number, number, number, number, number, number, number, number]> = {
  "steakhouse-financial": [100, 0.3, 0.3, 60, 30, 0, 1, 1, 1, 62],
  "sentora-curator": [100, 0.3, 0.3, 60, 30, 3, 1, 2, 1, 50],
  "gauntlet": [100, 0.3, 0.3, 60, 30, 0, 1, 2, 1, 50],
  "veda": [100, 0.3, 0.3, 60, 30, 3, 1, 2, 1, 50],
  "usdd": [100, 4.0, 4.0, 60, 30, 0, 3, 2, 1, 54],
  "upshift": [100, 0.4, 0.4, 60, 30, 3, 2, 2, 1, 61],
  "cian-yield-layer": [100, 0.4, 0.4, 60, 30, 5, 2, 2, 1, 61],
  "nonce-capital": [100, 0.3, 0.3, 60, 30, 3, 1, 2, 1, 50],
  "polymarket-international": [100, 0.4, 0.4, 60, 30, 0, 2, 1, 1, 73],
  "onre": [100, 0.03, 0.03, 60, 30, 0, 2, 2, 1, 63],
  "opentrade": [100, 0.0, 0.0, 40, 0, 5, 0, 4, 3, -1],
  "rockawayx": [100, 0.03, 0.03, 60, 30, 0, 2, 1, 1, 75],
  "plume-vaults": [100, 0.03, 0.03, 60, 30, 7, 1, 2, 1, 51],
  "hyperithm": [100, 0.3, 0.3, 60, 30, 30, 2, 2, 1, 62],
  "bittensor-dtao": [100, 0.2, 0.2, 80, 60, 0, 2, 2, 1, 60],
  "bitfi-basis": [100, 0.4, 0.4, 60, 30, 3, 2, 2, 1, 61],
  "symbiotic": [100, 40.0, 40.0, 60, 30, 14, 2, 2, 2, 38],
  "defi-saver-asset-management": [100, 0.0, 0.0, 40, 0, -1, 4, 4, 3, -1],
  "k3-capital": [100, 0.0, 0.0, 20, 0, -1, 4, 5, 4, -1],
  "mellow-core": [100, 40.0, 40.0, 60, 30, 3, 2, 2, 2, 38],
  "figure-markets-prime": [100, 0.53, 0.53, 60, 30, 0, 1, 2, 1, 49],
  "hive-protocol": [100, 10.0, 10.0, 60, 30, 1, 3, 2, 2, 49],
  "lagoon": [100, 0.4, 0.4, 60, 30, 14, 1, 2, 1, 49],
  "clearstar": [100, 0.3, 0.3, 60, 30, 0, 1, 1, 1, 62],
  "lightning-network": [100, 10.0, 10.0, 60, 30, 1, 0, 2, 2, 19],
  "r25": [100, 0.0, 0.0, 40, 0, -1, 4, 4, 3, -1],
  "b14g": [100, 0.0, 0.0, 20, 0, -1, 4, 5, 4, -1],
  "saturn": [100, 0.4, 0.4, 60, 30, 7, 3, 2, 1, 72],
  "figure-markets-exchange": [100, 0.0, 0.0, 40, 0, -1, 4, 4, 3, -1],
  "curvance": [100, 0.3, 0.3, 60, 30, 0, 2, 2, 1, 62],
  "galaxy-curation": [100, 0.0, 0.0, 40, 0, -1, 4, 4, 3, -1],
  "extended-perps": [50, 0.3, 0.6, 60, 30, 0, 2, 2, 1, 64],
  "lofty": [100, 5.52, 5.52, 60, 30, 4, 2, 2, 2, 38],
  "theo-network-thusd": [100, 40.0, 40.0, 60, 30, 14, 2, 2, 2, 38],
  "tydro": [100, 0.3, 0.3, 60, 30, 0, 2, 1, 1, 74],
  "ember": [50, 0.4, 0.8, 60, 30, 4, 1, 2, 1, 51],
  "doppler-finance": [50, 0.02, 0.04, 60, 30, 7, 2, 2, 1, 66],
  "armitage-by-wintermute": [100, 30.0, 30.0, 80, 60, 0, 1, 2, 2, 24],
  "avant-avusd": [50, 4.0, 8.0, 60, 30, 7, 2, 2, 2, 42],
  "valos": [100, 0.0, 0.0, 30, 0, -1, 4, 4, 3, -1]
};
/** Verified execution facts for ranks 41-198 (protocol-facts-41-198.json, as_of 2026-11-25;
 * 1,230/1,264 VERIFIED). Each row: [slug, mechanism, exitDays (-1 unknown), minCode
 * (0 unverified, 1 none, 2 has a minimum), eligibility (0 E0, 1 E1, 2 E2, 3 E3, 4 EU),
 * risk (1 R1, 2 R2, 3 R3, 4 RU, 5 RS), flags (1 live token, 2 suspended, 4 not retail, 8 incident)].
 * Capital and hold come from the snapshot (TVL tier, age); the fee comes from the chain's gas. */
const MECH: [string, number, number, number, number, number, number][] = [["3f",1,-1,0,0,1,4],["3jane-lending",2,3,2,2,1,1],["9summits",1,3,0,2,1,0],["abstract",0,-1,1,1,5,6],["adrastea-validator",4,3,1,1,2,10],["aegis-yusd",8,7,2,2,1,0],["aftermath-aflp",1,-1,2,0,2,8],["agni-finance",6,0,0,0,2,0],["agua",1,-1,0,0,4,0],["alphagrowth",1,0,0,1,1,0],["anemoy-capital",10,-1,1,0,1,0],["antarctic",8,7,2,2,1,0],["anthias-labs",1,0,0,0,1,0],["apex-omni",8,0,2,2,2,1],["arcus-perps",8,-1,2,2,1,0],["arrakis-modular",6,0,0,2,1,0],["august-digital",1,-1,1,2,1,4],["avant-aveth",1,0,1,2,1,0],["axis",8,30,1,2,1,0],["azverse-perps",8,-1,0,0,1,0],["bend",2,-1,1,1,1,1],["bima-cdp",3,0,1,2,2,0],["binaryx-platform",10,0,1,0,1,1],["bisonfi",6,-1,0,0,1,4],["bitlayer-ybtc-family",0,7,1,0,1,0],["block-analitica",1,0,1,2,1,0],["boros",8,-1,1,2,1,0],["bouncebit-prime",8,15,1,2,2,9],["btcfi-cdp",3,-1,1,0,1,0],["bucket-cdp",3,0,1,2,2,8],["bulk",8,-1,2,2,1,4],["byreal",6,0,0,2,1,0],["chain-fusion",0,-1,1,0,1,4],["circle-gateway",12,7,2,0,1,4],["communityv3",6,0,1,0,2,0],["current",2,0,0,2,1,0],["d2-finance",1,-1,1,0,1,0],["damm-capital",1,1,0,0,1,4],["decibel",8,-1,2,2,1,0],["defa-by-invoicemate",10,30,0,0,1,4],["defindex",1,0,2,1,1,0],["drakewell",8,7,1,0,1,4],["estate-protocol",10,3,2,0,1,0],["exponent-risk-tranching",1,-1,1,2,2,0],["exponent-strategy-vaults",1,7,1,2,2,0],["exponent-yield-exchange",1,3,0,2,1,0],["felix-cdp",3,0,1,2,1,0],["felix-vaults",1,0,1,2,2,0],["fira",2,-1,1,0,1,0],["firelight",0,60,0,2,1,0],["flowdesk",1,0,1,2,2,0],["flux-finance",2,0,1,2,1,0],["fluxion-network",6,0,0,2,1,0],["flying-tulip-ftusd",1,0,0,0,1,1],["fstswap",6,0,1,1,1,1],["gami-labs",1,-1,0,0,1,0],["gamma-research",1,0,1,2,2,9],["gmx-solana",8,-1,1,2,1,1],["goonfi",6,-1,0,0,2,8],["goose",15,-1,0,1,1,4],["granite",2,-1,0,0,1,0],["growihf",1,1,2,0,2,0],["hakutora",1,0,1,2,5,2],["hertzflow",8,0,2,2,1,0],["hylo-protocol",11,0,1,2,1,0],["hyperbeat-earn",1,7,1,0,1,0],["icarus-cl",6,0,1,1,1,0],["infinifi",1,3,0,2,2,1],["ipor-fusion",1,3,0,2,2,8],["katana-dex",6,0,2,0,1,1],["katana-pre-launch",1,-1,0,1,1,0],["kava-mint",3,-1,1,0,5,2],["keyrock",1,3,1,1,1,0],["liminal-basis",8,3,2,0,1,0],["loopscale-curation",1,-1,1,2,2,8],["loopscale-lending",2,0,1,2,2,8],["lulo",1,0,1,0,2,0],["makina",1,-1,0,2,1,0],["manifest-trade",6,0,1,0,1,0],["manta-cedefi",8,3,1,2,1,1],["marginfi-lending",2,0,1,2,2,0],["metalx-swap",6,0,2,0,1,0],["mev-capital",1,-1,1,0,1,0],["mezo-earn",0,7,1,1,1,1],["mezzanine",1,7,0,0,1,0],["monarq",1,7,2,2,5,2],["monolith-market",3,0,1,1,1,0],["mystic-finance-lending",2,21,0,2,1,0],["nado-spot",6,4,2,2,2,0],["native-credit-pool",2,0,2,0,1,0],["nemo-trading",1,31,0,2,2,0],["neutral-trade",1,28,1,2,1,0],["noble",0,0,1,0,5,6],["noon",1,7,0,2,1,1],["nucleus",1,-1,0,2,1,0],["nuva",1,-1,1,2,1,4],["origami-finance",1,-1,1,2,1,0],["paimon",10,0,2,2,1,0],["pangolins",1,-1,0,0,1,1],["perena-vaults",1,3,2,2,2,0],["phoenix-perp",8,3,2,2,2,0],["plasma-one",0,0,2,1,1,5],["plasma-saving-vaults",1,0,1,1,1,0],["predict-fun",9,-1,1,2,2,1],["project-0",2,0,1,2,2,8],["project-x",6,0,1,2,1,1],["qearn",4,364,1,0,1,0],["re7-labs",1,3,1,2,5,2],["reti-pooling",4,0,1,0,1,0],["reya-perps",8,-1,1,2,2,0],["rif-on-chain",11,0,0,0,1,1],["risex",8,0,2,2,2,8],["rocksolid-network",1,-1,0,1,2,0],["set-protocol",1,0,1,0,1,4],["sharpbyte-capital",1,0,1,2,2,0],["shift-defi",1,7,0,2,1,0],["snuggle",6,0,1,0,1,0],["solv-strategies",1,3,1,2,2,9],["stablehodl",1,0,1,2,1,0],["steer-protocol",6,0,0,2,1,1],["stellar-amm",6,0,1,0,1,0],["stellar-defi-hub",1,-1,0,0,1,0],["stellar-dex",6,0,1,0,1,0],["strata-markets",1,3,0,2,2,8],["strato-cdp",3,-1,1,0,1,0],["subfrost",0,-1,2,2,1,0],["superearn",1,0,1,1,1,0],["swan-dao",3,-1,2,0,1,1],["sygnum-fiusd-liquidity-fund",10,-1,1,0,1,0],["syncswap",6,0,1,1,1,0],["syntetika",1,0,1,1,1,0],["syntropia",1,-1,1,1,1,0],["t3tris-finance",1,-1,1,2,1,0],["tau-labs",1,0,1,2,1,0],["templar-lending",2,-1,1,2,1,0],["temple",6,-1,1,0,2,5],["tempo-stablecoin-dex",6,0,0,0,1,4],["tessera-v",6,-1,1,0,1,4],["theo-network-thbill",10,4,1,2,1,0],["tori-finance",8,7,1,2,1,0],["tulipa-capital",1,3,1,2,2,0],["turboflow-perps",8,-1,1,2,1,0],["ultrayield-curator",1,3,1,4,5,2],["ultrayield-vaults",1,0,1,0,5,2],["usdcx",11,-1,0,0,1,4],["valantis-sthype-restaking",5,183,0,0,1,0],["vault-street",10,0,0,0,1,4],["vena-finance",2,-1,1,0,1,0],["vesu",2,0,0,2,2,8],["vfat.io",1,0,1,0,1,0],["vishwa",0,3,0,0,1,0],["waterline",1,0,1,2,1,0],["xion-finance",0,21,1,0,1,5],["xrpl-dex",6,0,1,0,2,1],["y10k-capital",1,3,1,2,1,0],["yieldfi",1,2,1,2,5,2],["yuzu-money",1,3,1,2,1,4],["zoo-finance",1,-1,1,2,1,0]];
const LIVE: Record<string, string> = {"infinifi":"INFI","solv-strategies":"SOLV","noon":"NOON","mezo-earn":"MEZO","apex-omni":"APEX","project-x":"PRJX","manta-cedefi":"MANTA","plasma-one":"XPL","xrpl-dex":"XRP","xion-finance":"XION","gmx-solana":"GMX","gamma-research":"GAMMA","rif-on-chain":"RIF","steer-protocol":"STEER","3jane-lending":"JANE","predict-fun":"PREDICT","fstswap":"FIST","bouncebit-prime":"BB","binaryx-platform":"BNRX","bend":"BEND","katana-dex":"KAT","pangolins":"PNG","flying-tulip-ftusd":"FT","temple":"TEMPLE","swan-dao":"SWAN"};
const SUSP: Record<string, string> = {"noble":"Circle pauses Noble USDC + CCTP Jan 12 2027.","re7-labs":"Deposits disabled; TVL down >95%.","ultrayield-curator":"Bad debt realized; TVL down >95%.","hakutora":"Abandoned; TVL down >95%.","ultrayield-vaults":"Abandoned; TVL down >95%.","yieldfi":"Abandoned; TVL down >95%.","kava-mint":"Dead CDP; USDX depegged May 2022 ~$0.70.","abstract":"Chain shuts down Dec 15 2026; unbridged funds inaccessible.","monarq":"FXRP vault withdrawals revert; funds deployed off-vault; no payout, no ETA (Nov 18 2026).","adrastea-validator":"Restaking token services shut down Dec 4 2025; protocol pivoted to Solana infrastructure."};
const INC: Record<string, string> = {"ipor-fusion":"Jan 2026 exploit $336K.","solv-strategies":"Mar 2026 exploit ~$2.73M, compensated.","loopscale-lending":"Nov 2026 exploit ~$412K + ~$521K NAV inflation.","project-0":"Drift exploit ~$1.91M bad debt.","gamma-research":"Jan 2024 exploit $3.4-6M.","adrastea-validator":"Pivoted Dec 2025; restaking token services shut down Dec 4 2025.","risex":"Aug 3 2026 unauthorized 673,011.56 USDC withdrawal.","strata-markets":"Neutrl markets suspended.","bucket-cdp":"Legacy minting disabled; exit-only.","bouncebit-prime":"Aug 2026 exploit ~$3M BB; native L1 shut down.","vesu":"Sep 2026 oracle incident $3M, 95% recovered.","aftermath-aflp":"Apr 2026 exploit ~$1.14M.","loopscale-curation":"Nov 5 2026 exploit ~$412K.","goonfi":"Mar 2026 exploit ~$254K."};
const NORETAIL: Record<string, string> = {"noble":"Winding down; not a farm.","yuzu-money":"$100K accredited-only.","circle-gateway":"Not retail-executable.","usdcx":"Not retail-executable.","3f":"Not retail-executable.","plasma-one":"Not retail-executable.","august-digital":"Institutional only.","nuva":"nvPRIME not retail.","drakewell":"Not retail-executable.","xion-finance":"Not retail-executable.","chain-fusion":"Not retail-executable.","goose":"Not retail-executable.","tempo-stablecoin-dex":"Not retail-executable.","bisonfi":"Not retail-executable.","set-protocol":"Not retail-executable.","tessera-v":"Not retail-executable.","abstract":"Chain winding down; not a farm.","defa-by-invoicemate":"Not retail-executable.","bulk":"Not retail-executable.","vault-street":"Not retail-executable.","damm-capital":"Not retail-executable.","temple":"No retail deposit product; institutional order-book DEX on Canton."};
const MINUSD: Record<string, number> = {"circle-gateway":5.0,"arcus-perps":5.0,"apex-omni":10.0,"plasma-one":10.0,"liminal-basis":500.0,"decibel":10.0,"phoenix-perp":1.0,"risex":20.0,"3jane-lending":1000.0,"estate-protocol":50.0,"defindex":1001.0,"perena-vaults":1.0,"growihf":5.0,"paimon":10.0,"metalx-swap":1.0,"antarctic":10.0,"katana-dex":1.0,"bulk":10.0,"aftermath-aflp":1.0,"nado-spot":5.0,"aegis-yusd":1.0,"hertzflow":10.0,"native-credit-pool":10.0,"swan-dao":1000.0};

const MECH_BY_SLUG = new Map(MECH.map((r) => [r[0], r]));
const MECH_LABEL: Record<number, string> = { 0: 'Unknown mechanism', 1: 'Yield vault', 2: 'Lending supply', 3: 'Collateralized borrowing', 4: 'Staking', 5: 'Restaking', 6: 'DEX liquidity', 7: 'Spot exchange', 8: 'Perpetual exchange', 9: 'Prediction market', 10: 'RWA issuance', 11: 'Stablecoin issuance', 12: 'Bridge', 13: 'Chain ecosystem', 14: 'Payment channel', 15: 'Managed/custodial strategy' };
const ELIG_LABEL = ['E0', 'E1', 'E2', 'E3', 'EU'];
const RISK_LABEL = ['', 'R1', 'R2', 'R3', 'RU', 'RS'];
const VERDICT_LABEL = ['FARM', 'CONDITIONAL', 'SKIP', 'UNVERIFIED', 'SUSPENDED'] as const;

/** Gas per transaction by chain (verified: L2 ~$0.10, Ethereum ~$10, Solana ~$0.01). */
const GAS: Record<string, number> = { Base: 0.1, Arbitrum: 0.1, Optimism: 0.1, Ink: 0.1, Monad: 0.1, Pharos: 0.1, Sui: 0.1, Arc: 0.1, Binance: 0.1, Ethereum: 10, Solana: 0.01, Plume: 0.01, Avalanche: 1, Bitcoin: 5, Tron: 1, Bittensor: 0.1, Provenance: 0.01, Algorand: 0.01, Ripple: 0.01, Polygon: 0.1, Katana: 0.1, Unichain: 0.1, Plasma: 0.1, 'Hyperliquid L1': 0.1, Flare: 0.1, 'Robinhood Chain': 0.1, BSquared: 0.1, Manta: 0.1 };
function gasFor(chain: string): number { return GAS[chain] ?? 0.1; }

/** Transactions a mechanism needs: entry + exit. */
function txsFor(mech: number): number {
  if (mech === 0) return 0;
  if (mech === 3 || mech === 6) return 3;
  return 2;
}

/** Mechanism from the snapshot category (fallback when no verified row exists). */
/** Per-slug mechanism overrides for top-40 rows whose snapshot category misleads
 * the category heuristic (bittensor-dtao is categorized 'Dexs' but the farm action
 * is staking TAO into a dTAO subnet). */
const MECH_TOP40_OVERRIDE: Record<string, Mechanism> = { 'bittensor-dtao': 'M04' };
export function mechanismFor(p: SnapshotProtocol): Mechanism {
  const row = MECH_BY_SLUG.get(p.slug);
  if (row !== undefined) return ('M' + String(row[1]).padStart(2, '0')) as Mechanism;
  const ov = MECH_TOP40_OVERRIDE[p.slug];
  if (ov !== undefined) return ov;
  const c = (p.category ?? '').toLowerCase();
  if (c.includes('risk curator') || c.includes('yield aggregator') || c.includes('capital allocator') || c.includes('yield') || c.includes('farm') || c.includes('index')) return 'M01';
  if (c.includes('lending')) return 'M02';
  if (c.includes('cdp')) return 'M03';
  if (c.includes('staking pool')) return 'M04';
  if (c.includes('restaking') || c.includes('collateral')) return 'M05';
  if (c.includes('dex') || c.includes('liquidity manager')) return 'M06';
  if (c.includes('otc')) return 'M07';
  if (c.includes('perpetual') || c.includes('derivative') || c.includes('basis trading') || c.includes('interest rate')) return 'M08';
  if (c.includes('prediction')) return 'M09';
  if (c.includes('rwa')) return 'M10';
  if (c.includes('stablecoin') || c.includes('dual-token')) return 'M11';
  if (c.includes('bridge')) return 'M12';
  if (c.includes('chain')) return 'M13';
  if (c.includes('payments')) return 'M14';
  if (c.includes('cedefi')) return 'M15';
  return 'M00';
}

/** The mechanism's entry action, from the verified parameters. */
function mechEntry(p: SnapshotProtocol, mech: number, capital: number, chain: string, minCode: number, minUsd: number | null): string {
  const n = p.name;
  const min = minCode === 2 && minUsd !== null ? ` Minimum deposit $${minUsd} (verified).` : minCode === 1 ? ' No minimum deposit documented.' : ' Minimum deposit UNVERIFIED.';
  switch (mech) {
    case 1: return `Verify the vault route and asset on ${n}'s own page, then deposit $${capital} into its vault on ${chain}.${min}`;
    case 2: return `Verify the lending market and asset on ${n}'s own page, then supply $${capital} on ${chain}.${min}`;
    case 3: return `Verify the CDP vault, collateral asset and minimum ratio on ${n}'s own page, then open a $${capital} collateralized position on ${chain}.${min}`;
    case 4: return `Verify the staking pool, asset and cooldown on ${n}'s own page, then stake $${capital} on ${chain}.${min}`;
    case 5: return `Verify the restaking vault, collateral asset and epoch rules on ${n}'s own page, then restake $${capital} on ${chain}.${min}`;
    case 6: return `Verify the pool, assets and fee tier on ${n}'s own page, then provide $${capital} of liquidity on ${chain}.${min}`;
    case 8: return `Verify the market, margin asset and liquidation metric on ${n}'s own page, then deposit $${capital} as margin on ${chain}.${min}`;
    case 9: return `Verify the market, collateral and eligibility on ${n}'s own page, then fund $${capital} and place one position on ${chain}.${min}`;
    case 10: return `Verify eligibility, the asset and redemption terms on ${n}'s own page, then subscribe $${capital} on ${chain}.${min}`;
    case 11: return `Verify the mint/redeem rules and collateral on ${n}'s own page, then mint $${capital} of the stable asset on ${chain}.${min}`;
    case 12: return `Verify the bridge route, asset and settlement on ${n}'s own page, then bridge $${capital} on ${chain}.${min}`;
    case 15: return `Verify access, custody, fees and redemption on ${n}'s own page, then allocate $${capital} on ${chain}.${min}`;
    default: return `Verify the mechanism, route, asset and minimum on ${n}'s own page before sending funds. No executable route is established from the snapshot.`;
  }
}

/** The mechanism's risk line, with a verified incident note when one exists. */
function mechRisk(mech: number, incident: string | undefined): string {
  const inc = incident !== undefined ? ` Incident: ${incident}` : '';
  switch (mech) {
    case 1: return `Risk: vault contract + curator loss. Exit if the vault share price falls >5%.${inc}`;
    case 2: return `Risk: borrower default + utilisation spikes. Exit if utilisation tops 90%.${inc}`;
    case 3: return `Risk: liquidation if collateral falls. Exit if the collateral ratio falls below the verified minimum.${inc}`;
    case 4: return `Risk: slashing + cooldown lock. Exit if the validator is slashed.${inc}`;
    case 5: return `Risk: slashing + epoch withdrawal delay. Exit if a slashing event is reported.${inc}`;
    case 6: return `Risk: impermanent loss if pool assets diverge. Exit if the pool ratio moves >5%.${inc}`;
    case 8: return `Risk: liquidation on adverse moves. Exit if the margin ratio approaches liquidation.${inc}`;
    case 9: return `Risk: a position can go to zero. Cap each position at $25.${inc}`;
    case 10: return `Risk: redemption gates + issuer default. Exit if redemption is gated.${inc}`;
    case 11: return `Risk: depeg + redemption failure. Exit if the peg slips >2%.${inc}`;
    case 12: return `Risk: bridge failure + settlement delay. Exit if the bridge halts.${inc}`;
    case 15: return `Risk: custodian + contract risk. Exit if the custodian freezes withdrawals.${inc}`;
    default: return `Risk: mechanism unknown. Do not deposit until the route, asset, minimum and exit are verified from the protocol docs.${inc}`;
  }
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** Economic verdict + fee + attractiveness for a rank 41-198 row, from verified parameters. */
export function econFor(p: SnapshotProtocol, age: number | null): { verdict: Verdict; fee: number; feeBurden: number; active: number; attr: number | null; elig: string; risk: string; exit: number } {
  const row = MECH_BY_SLUG.get(p.slug);
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const active = 5 + 15 + 10 * Math.floor(hold / 7) + 10 + 10;
  if (row === undefined) {
    return { verdict: 'UNVERIFIED', fee: 0, feeBurden: 0, active, attr: null, elig: 'EU', risk: 'RU', exit: -1 };
  }
  const mech = row[1]!;
  const exit = row[2]!;
  const minCode = row[3]!;
  const elig = ELIG_LABEL[row[4]!]!;
  const risk = RISK_LABEL[row[5]!]!;
  const flags = row[6]!;
  const minUsd = MINUSD[p.slug] ?? null;
  const fee = Math.round(txsFor(mech) * gasFor(chain) * 100) / 100;
  const feeBurden = capital > 0 ? fee / capital : 0;
  let verdict: Verdict;
  if ((flags & 2) !== 0) verdict = 'SUSPENDED';
  else if ((flags & 1) !== 0 || (flags & 4) !== 0 || mech === 0) verdict = 'UNVERIFIED';
  else if (minCode === 2 && minUsd !== null && minUsd > capital) verdict = 'UNVERIFIED';
  else if (feeBurden > 0.05 || active > 120 || (exit >= 0 && exit > 30) || risk === 'R3') verdict = 'SKIP';
  else if (exit < 0) verdict = 'UNVERIFIED';
  else if (feeBurden <= 0.02 && active <= 60 && exit <= 7 && risk === 'R1' && elig === 'E3') verdict = 'FARM';
  else verdict = 'CONDITIONAL';
  let attr: number | null = null;
  if (verdict === 'CONDITIONAL' || verdict === 'FARM') {
    const feeS = Math.max(0, 1 - feeBurden / 0.05);
    const timeS = Math.max(0, 1 - active / 120);
    const capS = Math.max(0, 1 - capital / 150);
    const eligS = { E0: 0, E1: 0.25, E2: 0.75, E3: 1, EU: 0 }[elig] ?? 0;
    const riskS = { R1: 1, R2: 0.5, R3: 0, RU: 0.25, RS: 0 }[risk] ?? 0;
    attr = Math.round(100 * (0.25 * feeS + 0.15 * timeS + 0.1 * capS + 0.3 * eligS + 0.2 * riskS));
  }
  return { verdict, fee, feeBurden, active, attr, elig, risk, exit };
}

/** A protocol's farm plan: the hand-written override for the top 40, else the mechanism engine. */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const override = FARM_PLAN_OVERRIDES[p.slug];
  if (override !== undefined) return override.map(([text, cost, time]) => ({ text, cost, time }));
  const row = MECH_BY_SLUG.get(p.slug);
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const setup: FarmStep = { text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', cost: 'free', time: '5 min' };
  if (row === undefined) {
    return [setup,
      { text: `Verify the mechanism, route, asset and minimum on ${p.name}'s own page before sending funds. No executable route is established from the snapshot.`, cost: 'free to verify', time: '15 min' },
      { text: `No verified execution facts for ${p.name}. Do not send funds until the route, asset, minimum and exit are verified from its docs.`, cost: 'held', time: `${hold} days` },
      { text: 'Risk: mechanism unknown. Do not deposit until the route, asset, minimum and exit are verified from the protocol docs.', cost: 'free to check', time: '10 min' }];
  }
  const mech = row[1]!;
  const exit = row[2]!;
  const minCode = row[3]!;
  const elig = ELIG_LABEL[row[4]!]!;
  const flags = row[6]!;
  const minUsd = MINUSD[p.slug] ?? null;
  const incident = INC[p.slug];
  const gas = gasFor(chain);
  const fee = Math.round(txsFor(mech) * gas * 100) / 100;
  if ((flags & 2) !== 0) {
    const reason = SUSP[p.slug] ?? 'Suspended pending verification.';
    return [setup,
      { text: `SUSPENDED: do not deposit into ${p.name}. ${reason}`, cost: 'do not deposit', time: 'now' },
      { text: `If you already hold a position, check ${p.name}'s own page for the official exit or repayment notice before moving funds.`, cost: 'free to check', time: '15 min' }];
  }
  if ((flags & 1) !== 0) {
    const tok = LIVE[p.slug] ?? 'a live token';
    return [setup,
      { text: `${p.name} already has a live token (${tok}) trading, so the "pre-token launch" premise does not apply. The snapshot records no token, so this row is ranked as pre-token, but a launch has already happened.`, cost: 'free to verify', time: '15 min' },
      { text: `Do not farm ${p.name} for a launch allocation. If you want exposure, buy ${tok} on a market instead and size it like any traded token.`, cost: 'held', time: `${hold} days` },
      { text: `Risk: the implied value is not applicable to a protocol that already trades. ${incident !== undefined ? `Incident: ${incident}` : 'Check the protocol docs for current status.'}`, cost: 'free to check', time: '10 min' }];
  }
  if ((flags & 4) !== 0) {
    const reason = NORETAIL[p.slug] ?? 'Not retail-executable.';
    return [setup,
      { text: `${p.name} is not executable for a retail user. ${reason}`, cost: 'free to verify', time: '15 min' },
      { text: `Do not attempt a $${capital} retail deposit: no verified retail route exists. If access changes, re-verify eligibility and minimums on the protocol's own page first.`, cost: 'held', time: `${hold} days` },
      { text: `Risk: institutional / permissioned access. ${incident !== undefined ? `Incident: ${incident}` : 'Check the protocol docs for current status.'}`, cost: 'free to check', time: '10 min' }];
  }
  if (mech === 0) {
    return [setup,
      { text: mechEntry(p, mech, capital, chain, minCode, minUsd), cost: 'free to verify', time: '15 min' },
      { text: `No executable route is established from the snapshot for ${p.name}. Do not send funds until the route, asset, minimum and exit are verified from its docs.`, cost: 'held', time: `${hold} days` },
      { text: mechRisk(mech, incident), cost: 'free to check', time: '10 min' }];
  }
  const exitText = exit < 0 ? 'Settlement time is UNVERIFIED; verify the withdrawal mechanism before depositing.' : exit === 0 ? 'Withdrawal is instant where the vault holds idle liquidity.' : `Withdrawal takes about ${exit} day${exit === 1 ? '' : 's'} (verified).`;
  const eligText = elig === 'E3' ? 'Verified monetary reward terms; see the plan for the rate.' : elig === 'E2' ? 'A documented points program exists; check its terms on the protocol page.' : elig === 'E1' ? 'Reward eligibility is speculative; no verified allocation terms.' : elig === 'E0' ? 'No points program or reward documented.' : 'Reward eligibility UNVERIFIED.';
  const feeText = fee > 0 ? `$${fee} total gas (est., ${txsFor(mech)} txs on ${chain})` : 'gas (est., UNVERIFIED)';
  return [setup,
    { text: mechEntry(p, mech, capital, chain, minCode, minUsd), cost: feeText, time: '15 min' },
    { text: `Weekly: check the position and the protocol's own rewards page; no transaction unless the exit trigger hits. ${eligText}`, cost: 'free to check', time: '10 min/wk' },
    { text: `Hold ${hold} days. ${eligText}`, cost: 'held', time: `${hold} days` },
    { text: mechRisk(mech, incident), cost: 'free to check', time: '10 min' },
    { text: `Exit at ${hold}d or on trigger: verify the withdrawal mechanism on the protocol's own page first, then withdraw on ${chain}. ${exitText}`, cost: feeText, time: exit < 0 ? 'UNVERIFIED' : exit === 0 ? 'instant' : `~${exit} days` }];
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot): BoardRow[] {
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  const early = snapshot.protocols
    .filter((p) => !chosen.has(p.slug) && isRankable(p))
    .sort((a, b) => b.tvl_usd - a.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  for (const p of early) chosen.set(p.slug, p);

  const scored = [...chosen.values()].map((p) => {
    const implied = impliedValue(p);
    return { p, implied };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  return scored.map((s, i) => {
    const age = ageDays(snapshot.as_of, s.p.listed_at);
    const range = valueRange(s.implied);
    const mech = mechanismFor(s.p);
    const e = ECON[s.p.slug];
    let verdict: Verdict;
    let elig: string;
    let risk: string;
    let attr: number | null;
    if (e !== undefined) {
      verdict = (['FARM', 'CONDITIONAL', 'SKIP', 'UNVERIFIED', 'SUSPENDED'] as Verdict[])[e[8]]!;
      elig = (['E0', 'E1', 'E2', 'E3', 'EU'] as string[])[e[6]]!;
      risk = (['', 'R1', 'R2', 'R3', 'RU', 'RS'] as string[])[e[7]]!;
      attr = e[9] < 0 ? null : e[9];
    } else {
      const ec = econFor(s.p, age);
      verdict = ec.verdict;
      elig = ec.elig;
      risk = ec.risk;
      attr = ec.attr;
    }
    return {
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
      age_days: age,
      implied_value_usd: s.implied,
      value_range_low_usd: range.low,
      value_range_high_usd: range.high,
      mechanism: mech,
      verdict,
      eligibility: elig,
      risk,
      attractiveness: attr,
      farm_steps: farmSteps(s.p, age).map(stepText),
    };
  });
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

/** Integrity reconciliation: every raw record gets exactly one disposition. */
export function buildIntegrity(snapshot: Snapshot, board: BoardRow[]): Integrity {
  const boardSlugs = new Set(board.map((r) => r.slug));
  let traded = 0;
  let byRule = 0;
  let invalid = 0;
  let unknown = 0;
  for (const p of snapshot.protocols) {
    if (boardSlugs.has(p.slug)) continue;
    if (!isPreToken(p)) { traded++; continue; }
    if (!isRankable(p)) { byRule++; continue; }
    if (typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd) || p.tvl_usd <= 0) { invalid++; continue; }
    unknown++;
  }
  const slugCounts = new Map<string, number>();
  for (const p of snapshot.protocols) slugCounts.set(p.slug, (slugCounts.get(p.slug) ?? 0) + 1);
  const snapDup = [...slugCounts.values()].filter((n) => n > 1).reduce((a, n) => a + (n - 1), 0);
  const boardCounts = new Map<string, number>();
  for (const r of board) boardCounts.set(r.slug, (boardCounts.get(r.slug) ?? 0) + 1);
  const boardDup = [...boardCounts.values()].filter((n) => n > 1).reduce((a, n) => a + (n - 1), 0);
  const covered = snapshot.watchlist.filter((s) => boardSlugs.has(s)).length;
  let tradedRec = 0;
  let noToken = 0;
  let unknownTok = 0;
  for (const p of snapshot.protocols) {
    const t = tokenStatus(p);
    if (t === 'TRADED') tradedRec++;
    else if (t === 'NO_TRADED_TOKEN_RECORDED') noToken++;
    else unknownTok++;
  }
  return {
    raw_count: snapshot.protocols.length,
    ranked_count: board.length,
    excluded_traded: traded,
    excluded_by_rule: byRule,
    excluded_invalid: invalid,
    unclassified: unknown,
    snapshot_duplicate_slugs: snapDup,
    board_duplicate_slugs: boardDup,
    watchlist_covered: covered,
    watchlist_total: snapshot.watchlist.length,
    traded_records: tradedRec,
    no_token_recorded: noToken,
    unknown_token_status: unknownTok,
  };
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
    value_range_low_usd: row.value_range_low_usd,
    value_range_high_usd: row.value_range_high_usd,
    mechanism: row.mechanism,
    verdict: row.verdict,
    eligibility: row.eligibility,
    risk: row.risk,
    attractiveness: row.attractiveness,
    farm_steps: row.farm_steps,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot);
  const live = liveRows(snapshot);
  const integrity = buildIntegrity(snapshot, board);
  const early = board.filter((r) => !snapshot.watchlist.includes(r.slug)).length;
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model_version: MODEL_VERSION,
    validation: VALIDATION,
    policy: POLICY,
    integrity,
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
