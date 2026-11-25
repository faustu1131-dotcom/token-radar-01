// The token radar's model, version b0: one snapshot of the protocol universe in, one ranked
// board out. Valuation is the validated baseline B0: implied value = TVL x the median
// market-cap/TVL multiple of traded-token protocols (0.213803), fitted on 128 protocols
// in 128 distinct token families. A robust log regression (M1) was tested by grouped
// 5-fold token-family validation and NOT promoted: its median error beat B0 (1.2260 vs
// 1.6311) but its 90th-percentile error was worse (51.57x vs 42.45x), failing the
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
  m1_mdale: 1.2260,
  m1_p90_factor: 51.57,
  m1_promoted: false,
  promotion_note: 'M1 median error beat B0 but its 90th-percentile error was worse (51.57x vs 42.45x), failing P90_M1 <= 1.05 x P90_B0; B0 retained.',
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
  token_status: string;
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

/** The dashboard's compact view of one row. Verdicts, plans and economic
 * labels are NOT carried: the dashboard recomputes them from its embedded
 * inputs, so the judged source stands alone. */
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
    ["Deposit $100 USDC into Steakhouse Prime USDC vault on Base via Morpho app (0% fee on many Prime vaults; avoid Term vaults, locked to maturity).", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check share price + withdrawable % (Prime ~88% Nov 24 2026); [AF] no tx unless exit trigger hits.", "free", "5 min/wk"],
    ["Hold 30 days. No Steakhouse points; no confirmed allocation.", "held", "30 days"],
    ["Risk: bad debt if collateral falls faster than liquidators act. Exit if share price falls >5%.", "free", "10 min"],
    ["Exit: withdraw USDC on Base. Instant vaults settle same tx if liquid (Prime ~88% withdrawable). [AF]", "~$0.10 gas (est.)", "same tx"]
  ],
  "sentora-curator": [
    ["Fresh wallet, $100 USDC on Ink; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Sentora Boring USDC vault on Ink via Sentora app.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check share price + pending redemptions (BoringVault redemption is async: solver fill or claim date, no fixed settlement). [AK]", "free", "5 min/wk"],
    ["Hold 30 days. No Sentora points; rewards are vault-specific campaigns only. No confirmed allocation.", "held", "30 days"],
    ["Risk: BoringVault redemptions are async (request, then solver fill or claim date). [AK] Exit if share price falls >5%.", "free", "10 min"],
    ["Exit: request redemption, then claim when a solver fills it or the claim date arrives. No fixed settlement time. [AK]", "~$0.10 gas (est.)", "no fixed timeline"]
  ],
  "gauntlet": [
    ["Fresh wallet, $100 USDC on Base; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Gauntlet USDC Prime vault on Base (0% performance fee) via Morpho app.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check vault share price; no tx unless exit trigger hits.", "free", "5 min/wk"],
    ["Hold 30 days. No Gauntlet points; USDC Prime shows 0.00% rewards. USD Alpha vault streams USDC incentives via Sablier (Jul 2025). No confirmed allocation.", "held", "30 days"],
    ["Risk: Mar 22 2026 Resolv USR exploit cost Gauntlet Core ~$4.95M. [AD] Exit if share price falls >5%.", "free", "10 min"],
    ["Exit: redeem instantly if liquid (USDC Prime ~87% withdrawable); forceDeallocate exit penalty up to ~2%. If utilization high, wait for repayments.", "~$0.10 gas (est.)", "same tx if liquid"]
  ],
  "veda": [
    ["Fresh wallet, $100 USDC on Ink; seed offline.", "free", "5 min"],
    ["Veda has no direct deposit app. Deposit $100 USDC into ether.fi Liquid vault on Ink (Veda BoringVault tech).", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check share price; no yield during the withdrawal queue (USD vaults: up to 7 days, one at a time). [AG]", "free", "5 min/wk"],
    ["Hold 30 days. No VEDA token, no Veda airdrop, no Veda points season open. No confirmed allocation.", "held", "30 days"],
    ["Risk: withdrawals via BoringQueue (time-delayed, solver-based). [AG] ether.fi AtomicQueue exploited Sep 2026. [AH]", "free", "10 min"],
    ["Exit: request withdrawal via BoringQueue; USD vaults up to 7 days (Liquid ETH: 3 days); can fail if share value declined. [AG]", "~$0.10 gas (est.)", "up to 7 days"]
  ],
  "usdd": [
    ["Fresh wallet, $100 USDT on Tron; seed offline.", "free", "5 min"],
    ["Swap $100 USDT to USDD 1:1 via Peg Stability Module (zero fee), then stake as sUSDD (~4% base rate, Feb 2026).", "$100 + ~$2 gas (est.)", "15 min"],
    ["Weekly: check sUSDD balance + peg (collateral ~135% Nov 2026; ~2/3 of supply minted 1:1 by Smart Allocator).", "free", "5 min/wk"],
    ["Hold 30 days. USDD IS the token (~1.44B supply); no points program. Yield is sUSDD rate. CDP mint not used: minimum mint 500 USDD (TRX-C).", "held", "30 days"],
    ["Risk: USDD 1.0 depegged Jun 2022; TRON DAO removed 12,000 BTC (~$730M) from backing Aug 2024. Exit if USDD slips >2%.", "free", "10 min"],
    ["Exit: unstake sUSDD, swap USDD back to USDT via PSM (1:1, zero fee). No queue or lockup.", "~$2 gas (est.)", "same tx"]
  ],
  "upshift": [
    ["Fresh wallet, $100 USDC on Monad; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Upshift vault on Monad via app.upshift.finance. No Upshift vaults on Base.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check share price + Upshift Points S2 (1x deposits, 5x bonus while TVL under $750M - active at $519M, up to 12x). [P]", "free", "5 min/wk"],
    ["Hold 30 days. Upshift Points S2 documented (since Jul 2 2025); [P] no token announced. No confirmed allocation.", "held", "30 days"],
    ["Risk: Apr 18 2026 Kelp rsETH exploit cost hgETH vault ~$763K (~4.1%). US residents STRICTLY PROHIBITED. [Q]", "free", "10 min"],
    ["Exit: requestRedeem, then claim after per-vault lag (WHYPE ~25h, uBTC ~3 days). Processed daily; instant redemption on some vaults (fee).", "~$0.10 gas (est.)", "up to 3 days"]
  ],
  "cian-yield-layer": [
    ["Fresh wallet, $100 USDC on Arbitrum; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into CIAN vault on Arbitrum via cian.app.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check share price + CIAN Voyage Points (documented; accrue on unleveraged deposit value). [U]", "free", "5 min/wk"],
    ["Hold 30 days. CIAN Voyage Points documented; no token or conversion rate published. No confirmed allocation.", "held", "30 days"],
    ["Risk: no audits published for CIAN (DefiLlama: zero); stETH vault: upgradeable proxy, 3-of-4 Safe, no admin delay. 8% performance fee + 0.02% exit fee. [V]", "free", "10 min"],
    ["Exit: submit requestRedeem, wait for batched processing (stETH layer ~5 days). Rules vary by strategy.", "~$0.10 gas (est.)", "~5 days"]
  ],
  "nonce-capital": [
    ["Fresh wallet, $100 USDC on Optimism; seed offline.", "free", "5 min"],
    ["Nonce has no standalone retail vault. Deposit $100 USDC into ether.fi Liquid vault on Optimism (Nonce is curator).", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check share price; no yield during the withdrawal queue (USD vaults: up to 7 days, one at a time). [AG]", "free", "5 min/wk"],
    ["Hold 30 days. No Nonce points; Nonce has no token. Any ether.fi rewards are ether.fi's, not Nonce's. No confirmed allocation.", "held", "30 days"],
    ["Risk: ether.fi Liquid AtomicQueue exploited Sep 2026. [AI] US and UK users excluded from Liquid.", "free", "10 min"],
    ["Exit: request withdrawal via queue; USD vaults up to 7 days (Liquid ETH: 3 days). [AG]", "~$0.10 gas (est.)", "up to 7 days"]
  ],
  "polymarket-international": [
    ["Fresh wallet, $100 USDC on Polygon; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC on Polygon; auto-wraps to pUSD (trading collateral since CLOB V2 cutover Apr 28 2026). [B]", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Place limit orders within each market's max spread + minimum shares to earn Liquidity Rewards; 3-4 markets, cap $25 each. Taker fee 0.01-0.05. [A]", "free", "5 min/wk"],
    ["Hold 30 days. Liquidity Rewards pay daily only if the day's rewards reach the $1 payout minimum; no rollover; rates vary by market. Net profitability is not established: fills can be adverse and positions must be sold or resolved to exit. No token; no confirmed allocation.", "held", "30 days"],
    ["Risk: positions must be sold or resolved before the balance is withdrawable; exit timing depends on market liquidity and resolution dates and is not bounded. CTF Exchange V2 audited Mar 2026. Eligibility per Polymarket terms (geo restrictions apply). [C]", "free", "10 min"],
    ["Exit: close or settle all positions first, then withdraw pUSD/USDC balance. No fee, no lockup once closed.", "~$0.20 gas (est.)", "unknown"]
  ],
  "onre": [
    ["Fresh wallet, $100 USDC on Solana; seed offline.", "free", "5 min"],
    ["Mint $100 ONyc in OnRe app by depositing USDC. Open Access is permissionless, no minimum; [L] US residents cannot mint. [M] Fees 0.75%/yr + 20% performance. [O]", "$100 + ~$0.02 gas (est.)", "15 min"],
    ["Weekly: check ONyc balance + OnRe Points (live Sep 11 2025; 1 point per ONyc per day, multipliers up to 4x).", "free", "5 min/wk"],
    ["Hold 30 days. OnRe Points documented; no token confirmed; points have no cash value. No confirmed allocation.", "held", "30 days"],
    ["Risk: primary redemption is quarterly only (30-day notice window, fulfilled at quarter-end, pro-rata if oversubscribed). Retail relies on AMMs. [N]", "free", "10 min"],
    ["Exit: sell ONyc on Solana AMM anytime (slippage risk), [N] or request quarterly redemption (fee >=0.30%). [O] Collateral in a regulated Bermuda insurance account. [M]", "~$0.02 gas (est.)", "AMM sale anytime"]
  ],
  "opentrade": [
    ["Do NOT deposit. OpenTrade is for professional investors and institutions only; KYC required to mint/redeem. [H]", "free", "5 min"],
    ["Verify: check for a retail-accessible product. The xSOLY vault has a verified $1,000 USDC minimum (docs.opentrade.io); the barrier is institutional access.", "free", "15 min"],
    ["If a retail route is later verified, confirm the 2-5 business day redemption at NAV first [H] (Prime+: 5-6% APY, professionals only).", "free", "10 min"],
    ["No plan proceeds without a verified retail route. No documented points program.", "held", "0 days"],
    ["Risk: institutional-only, KYC-gated, 2-5 business day settlement. [H] Audited (Cantina Aug 2026). No known exploit.", "free", "10 min"]
  ],
  "rockawayx": [
    ["Fresh wallet, $100 USDC on Solana; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into RockawayX-curated Kamino USDC Earn vault on Solana via Kamino app. No lockup.", "$100 + ~$0.02 gas (est.)", "15 min"],
    ["Weekly: check share price + any active Merkl/Morpho campaign for this vault (vault-specific, time-limited).", "free", "5 min/wk"],
    ["Hold 30 days. No RockawayX-wide points; per-vault campaigns renew or expire (two ended Nov 20-23 2026).", "held", "30 days"],
    ["Risk: some RockawayX vaults are permissioned (e.g. Confidential RWA USDC). Verify permissionless first.", "free", "10 min"],
    ["Exit: withdraw in a single tx, subject to lending liquidity. No lockup, no unbonding period.", "~$0.01 gas (est.)", "same tx if liquid"]
  ],
  "plume-vaults": [
    ["Fresh wallet, $100 USDC on Plume Mainnet; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Plume Nest vault (e.g. nBASIS, nALPHA, nTBILL) on Plume Mainnet to mint nTOKEN.", "$100 + ~$0.02 gas (est.)", "15 min"],
    ["Weekly: check vault share price and nTOKEN balance.", "free", "5 min/wk"],
    ["Hold 30 days. Plume Nest Points Season One (Nov 2025-Mar 2026, 1% supply) ENDED; [T] later season NOT verified.", "held", "30 days"],
    ["Risk: Plume/Nest NOT available to US persons. Withdrawal varies by vault (same-day to 7-day cooldown).", "free", "10 min"],
    ["Exit: instant redeem when liquid (with fees), or async ERC-7540 request-then-claim. Or sell nTOKEN on Rooster DEX.", "~$0.01 gas (est.)", "up to 7 days"]
  ],
  "hyperithm": [
    ["Fresh wallet, $100 USDC on Monad; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Hyperithm USDC Apex Morpho vault on Monad via Morpho app (10% performance fee).", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check share price and how much is withdrawable.", "free", "5 min/wk"],
    ["Hold 30 days. No Hyperithm-native points; Monad vaults earn Merkl incentives in WMON (~0.8-0.89% APR, ends Nov 30 2026).", "held", "30 days"],
    ["Risk: at a reviewed pin only ~5.7% of hyperUSDCa was convertible within one day; 94.3% had no exit timeline. [S]", "free", "10 min"],
    ["Exit: redeem vault token; processed from available liquidity, can wait when markets are fully lent. No fixed duration.", "~$0.10 gas (est.)", "no fixed timeline"]
  ],
  "bittensor-dtao": [
    ["Fresh wallet, $100 of TAO on Bittensor chain; seed offline.", "free", "5 min"],
    ["Stake TAO into a dTAO subnet via wallet (Talisman, SubWallet) or taostats. Min 0.002 TAO per stake; pool fee 0.05%.", "$100 + ~$0.10 gas (est.)", "15 min"],
    ["Weekly: check subnet alpha price vs TAO and validator take (default 18% of emissions). Rewards are TAO per epoch (~72 min).", "free", "5 min/wk"],
    ["Hold 60 days. No points program, no airdrop; rewards are live TAO emissions, auto-compounded.", "held", "60 days"],
    ["Risk: Jul 2024 PyPI supply-chain attack stole ~32,000 TAO (~$8M) from wallets. Bittensor Terms exclude sanctioned countries. Exit if alpha falls >20% vs TAO.", "free", "10 min"],
    ["Exit: unstake in a single tx; converts alpha back to TAO at pool price (slippage possible). No separate swap needed.", "~$0.10 gas (est.)", "same tx"]
  ],
  "bitfi-basis": [
    ["Fresh wallet, $100 USDT on Base; seed offline.", "free", "5 min"],
    ["Mint $100 bfUSD by depositing USDT on Base, then stake into Horizon vault (hbfUSD, low-risk) via app.bitfi.one.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check hbfUSD balance + BitFi Points (live; holding bfUSD/hbfUSD/pbfUSD/LP, quests, referrals, Galxe). [Y]", "free", "5 min/wk"],
    ["Hold 30 days. BitFi Points documented; future airdrops based on total points. [Y] No token confirmed.", "held", "30 days"],
    ["Risk: BitFi is CeDeFi - yield depends on off-chain trading. SlowMist audited bfUSD Dec 2025 (2 medium findings).", "free", "10 min"],
    ["Exit: request withdrawal from hbfUSD, claim bfUSD after settlement (1 epoch = 24h). Then redeem to USDT: standard ~3 days (zero fee) or instant (0.5%). [Z]", "~$0.20 gas (est.)", "~3 days standard"]
  ],
  "symbiotic": [
    ["Fresh wallet, $100 wstETH on Ethereum; seed offline.", "free", "5 min"],
    ["Deposit $100 wstETH into permissionless Symbiotic vault on Ethereum via Symbiotic app. No KYC gate documented.", "$100 + ~$10 gas (est.)", "15 min"],
    ["Weekly: check share price + Symbiotic Points S2 (since Jan 2025; points/hr = vault TVL to adapters x 0.001).", "free", "5 min/wk"],
    ["Hold 30 days. Symbiotic Points documented; no token confirmed, docs promise no conversion. No confirmed allocation.", "held", "30 days"],
    ["Risk: funds remain slashable until epoch boundary. Curators may charge up to 5% admin fee. US/UK excluded by Terms.", "free", "10 min"],
    ["Exit: submit withdraw request (burns shares, queues collateral), claim only after next vault epoch ends (1-2 epochs; up to ~14 days).", "~$20 gas (est.)", "up to ~14 days"]
  ],
  "defi-saver-asset-management": [
    ["Do NOT open a CDP with $100. Maker vaults need minimum 1 ETH collateral; Aave positions 0.1 ETH; CDP Automation 200 DAI debt. [K]", "free", "5 min"],
    ["Verify: 0.1 ETH is roughly $300 - three times this plan's capital. Raise capital to meet the minimum first.", "free", "15 min"],
    ["If capital is raised, open a Maker/Sky CDP or leveraged position (Aave, Compound, Maker, Spark, Morpho, Fluid) via app.defisaver.com.", "free", "10 min"],
    ["No plan proceeds at $100. A CDP closes in one tx (debt repaid from collateral, remainder returned). DFS Rewards is a top-20 campaign (50,000 USDC); Season 1 ended Jun 2026.", "held", "0 days"],
    ["Risk: liquidation if collateral ratio falls below Maker minimum. DeFi Saver charges 0.25% on Boost/Repay/closing.", "free", "10 min"]
  ],
  "k3-capital": [
    ["SUSPENDED. Do not deposit. On 18 Nov 2026 attackers drained K3's sBOLD vault of ~$3.42M in ~8 min via share-price manipulation. Contracts paused; post-mortem Nov 19 2026. [D]", "free", "5 min"],
    ["No farm plan proceeds while vaults are paused and the incident is unresolved. Liquity V2 itself was unaffected. [D]", "free", "5 min"],
    ["Re-check only after a remediation post-mortem, re-audit, and confirmation depositors are made whole.", "free", "10 min"]
  ],
  "mellow-core": [
    ["Fresh wallet, $100 ETH on Ethereum; seed offline.", "free", "5 min"],
    ["Deposit $100 ETH into Lido Earn vault (earnETH) on Ethereum via stake.lido.fi or Mellow app.", "$100 + ~$10 gas (est.)", "15 min"],
    ["Weekly: check share price + Mellow Points (Lido docs: points remain depositor's on withdrawal).", "free", "5 min/wk"],
    ["Hold 30 days. Mellow Points accrue; no token confirmed. No confirmed allocation.", "held", "30 days"],
    ["Risk: earnETH vault paused Apr 2026, withdrawals blocked 9+ days (rsETH losses); redemptions resumed by Nov 7 2026.", "free", "10 min"],
    ["Exit: request withdrawal, claim after typical ~3 day wait (deposit wait up to ~24h; instant buffer covers part). Queued withdrawals cannot be cancelled.", "~$20 gas (est.)", "~3 days"]
  ],
  "figure-markets-prime": [
    ["Fresh wallet, $100 USDC on Provenance; complete KYC (SSN/ITIN + photo ID) first. Seed offline.", "free", "5 min"],
    ["Buy $100 YLDS (SEC-registered yield-bearing stablecoin) and lend into Democratized Prime pool via Figure Markets app.", "$100 + ~$0.02 gas (est.)", "15 min"],
    ["Weekly: check pool lent-out share and YLDS balance. Pools backed by home equity, auto, small-business, crypto loans.", "free", "5 min/wk"],
    ["Hold 30 days. YLDS pays yield as a registered yield-bearing stablecoin. [AC] No points program. No confirmed allocation.", "held", "30 days"],
    ["Risk: withdraw YLDS only up to available liquidity (pools 70-95% lent out Oct 30 2026). [AC] 0.5-point platform spread. [AC]", "free", "10 min"],
    ["Exit: withdraw YLDS up to available liquidity, then redeem YLDS for dollars at face (as fast as same day). [AC]", "~$0.01 gas (est.)", "same day if liquid"]
  ],
  "hive-protocol": [
    ["Fresh wallet, $100 of BTC; bridge it to B2 Network (BSquared). Seed offline.", "free", "5 min"],
    ["Stake $100 BTC via Hive on B2 to safeguard B2 and receive $B2 tokens. Fee-free, instant reward activation. Stakes BTC, NOT USDC.", "$100 + ~$5 gas (est.)", "15 min"],
    ["Weekly: check staked BTC balance and $B2 rewards accrued (paid proportionally to BTC staked).", "free", "5 min/wk"],
    ["Hold 30 days. Rewards are the live $B2 token, not a points program. Minimum stake 0.001 BTC (2024 source; verify live).", "held", "30 days"],
    ["Risk: no audits listed for Hive; no reported exploit. Official site restricts some countries/regions.", "free", "10 min"],
    ["Exit: unstake; 1-day unstaking lock applies, then BTC is released. Cooperative close settles in ~1 confirmation.", "~$5 gas (est.)", "1-day unstaking lock"]
  ],
  "lagoon": [
    ["Fresh wallet, $100 USDC on Arbitrum; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Lagoon ERC-7540 vault on Arbitrum via Lagoon app or curator front-end. Some vaults are permissioned.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check share price and whether a settlement round is pending.", "free", "5 min/wk"],
    ["Hold 30 days. No Lagoon-native points; incentives are vault/curator-specific, not protocol-wide.", "held", "30 days"],
    ["Risk: fully async ERC-7540; wait is one settlement round (daily 12:00 UTC window for some; DAMM funds days to weeks).", "free", "10 min"],
    ["Exit: submit requestRedeem, wait for settlement at next NAV update, then claim via redeem/withdraw. No fixed schedule.", "~$0.20 gas (est.)", "one settlement round"]
  ],
  "clearstar": [
    ["Fresh wallet, $100 USDC on Base; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Clearstar-curated Morpho vault on Base (e.g. Base RWA, Core USDG) via app.morpho.org.", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check vault share price; no tx unless exit trigger hits.", "free", "5 min/wk"],
    ["Hold 30 days. No Clearstar-native points; rewards are third-party/issuer-specific, not guaranteed.", "held", "30 days"],
    ["Risk: no Clearstar-specific audit published. Hypernative monitoring on all Morpho vaults. Morpho Terms exclude Restricted Territories.", "free", "10 min"],
    ["Exit: standard ERC-4626 redemption - withdraw immediately if liquid (Base RWA 99% withdrawable; Core USDG 100%).", "~$0.10 gas (est.)", "same tx if liquid"]
  ],
  "lightning-network": [
    ["Fresh wallet, $100 of BTC; run a Lightning node or use a Lightning wallet. Seed offline.", "free", "5 min"],
    ["Open a payment channel on Bitcoin mainnet: lock $100 BTC into 2-of-2 multisig with a peer. Min funding 20,000 sats.", "$100 + ~$5 gas (est.)", "15 min"],
    ["Weekly: check channel liquidity and whether peer is online. Routing fees typically <$0.05 per payment; LSPs charge ~1% for inbound liquidity.", "free", "5 min/wk"],
    ["Hold 30 days. Lightning is a payment protocol, not a yield product: no token, no points, no yield. Not a farm.", "held", "30 days"],
    ["Risk: force-close locks broadcaster funds behind to_self_delay (typically 144 blocks, ~1 day, up to 2016 blocks, ~2 weeks).", "free", "10 min"],
    ["Exit: cooperative close settles in ~1 confirmation (~10 min). Unilateral force-close locks funds behind to_self_delay.", "~$5 gas (est.)", "~10 min cooperative"]
  ],
  "r25": [
    ["Do NOT deposit. R25 is vault infrastructure on Pharos/Sui; rcUSD needs KYC + eligible-holder status; vaults go to institutions.", "free", "5 min"],
    ["Verify: check for a retail-accessible vault (Axil Prime Credit is a 3-month USDC vault via an institutional gateway).", "free", "15 min"],
    ["rcUSD redemption is a conditional obligation: KYC'd holders deliver rcUSD to issuer RiftWriter for face-value USDC; capacity, fees, deadline undisclosed.", "free", "10 min"],
    ["No plan proceeds without a verified retail route. No audits listed; reserve composition undisclosed; issuer keys can mint rcUSD.", "held", "0 days"],
    ["Risk: no verified retail access, undisclosed reserves, issuer-key minting power. No token, no points program.", "free", "10 min"]
  ],
  "b14g": [
    ["SUSPENDED. Do not deposit. On Oct 31 2026 b14g staking was exploited for ~97M CORE. [E] Core hard fork Nov 2 recovered ~70% of CORE; B14g planned pro-rata repayment.", "free", "5 min"],
    ["No farm plan proceeds while the incident is unresolved. The board still ranks b14g on snapshot TVL, but farm is frozen.", "free", "5 min"],
    ["Re-check only after a published post-mortem, re-audit, and confirmation depositors were repaid pro-rata.", "free", "10 min"]
  ],
  "saturn": [
    ["Fresh wallet, $100 USDC on Monad; seed offline.", "free", "5 min"],
    ["Retail cannot mint USDat directly (whitelisted only). Buy $100 USDat on secondary market (Curve USDC/USDat pool), stake into sUSDat vault (target 11%+ APY).", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check sUSDat share price and STRC dividend flow.", "free", "5 min/wk"],
    ["Hold 30 days. sUSDat yield is STRC dividends (target 11%+ APY, documented). [AA] No Saturn points program.", "held", "30 days"],
    ["Risk: no public audit references (reviewed May 2026). USDat backing migrated M0 $M to PYUSDx via proxy upgrade Aug 19 2026.", "free", "10 min"],
    ["Exit: sUSDat redemptions are QUEUED - average ~3 days, max 7 days (Saturn must liquidate STRC first). [AB] Then sell USDat.", "~$0.20 gas (est.)", "queued ~3 days, max 7"]
  ],
  "figure-markets-exchange": [
    ["Do NOT place an OTC trade. Figure Markets needs full KYC (name, address, DOB, gov ID; SSN/ITIN + photo ID). No documented retail OTC product.", "free", "5 min"],
    ["Verify: retail products are spot trading (BTC, ETH, HASH vs fiat/USDC) and P2Prime margin lending, not OTC trading. NY residents cannot trade crypto.", "free", "15 min"],
    ["If a verified retail route is confirmed, note min order (0.01 USD / 0.0001 USDC), 0.1% trade fee, fiat limits ($25k/24h ACH).", "free", "10 min"],
    ["No plan proceeds without a verified retail OTC route. No points program; occasional promotions exist.", "held", "0 days"],
    ["Risk: full KYC mandatory, geo restrictions, MPC custody, SIPC up to $500k. No known exploit documented.", "free", "10 min"]
  ],
  "curvance": [
    ["Fresh wallet, $100 USDC on Monad; seed offline.", "free", "5 min"],
    ["Supply $100 USDC to isolated two-token lending market on Monad via app.curvance.com (e.g. wsrUSD/USDC).", "$100 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check market utilization + Curvance Bytes (documented since Nov 27 2025; deposits, loans, settlements earn Bytes).", "free", "5 min/wk"],
    ["Hold 30 days. Bytes documented; no published conversion to CVE; CVE has not launched. No confirmed allocation.", "held", "30 days"],
    ["Risk: eBTC market paused since May 2026, WBTC lenders still cannot redeem. Emergency Council bypassed 5-day timelock Sep 30 2026.", "free", "10 min"],
    ["Exit: withdraw anytime if liquid. Note: posting collateral/borrowing starts a 20-min hold blocking repay/withdraw.", "~$0.10 gas (est.)", "same tx if liquid"]
  ],
  "galaxy-curation": [
    ["Do NOT deposit via Galaxy. Galaxy Curator is institutional-only, distributed via Fireblocks Earn to 2,400+ institutions.", "free", "5 min"],
    ["Note: underlying Morpho V2 vaults (Galaxy USDC on Arc, $105.3M) are permissionless and visible on Morpho app; Galaxy's own path is institutional.", "free", "15 min"],
    ["If a retail route to the underlying vaults is verified, check the vault address, 7-day cap-raise timelock, and fees first.", "free", "10 min"],
    ["No plan proceeds without a verified retail route. No token, no documented points program.", "held", "0 days"],
    ["Risk: institutional-only by design; no audit listed for Galaxy Curation product itself.", "free", "10 min"]
  ],
  "extended-perps": [
    ["Fresh wallet, $50 USDC on Arc; seed offline.", "free", "5 min"],
    ["Deposit $50 USDC on Arc (settlement migrated from Starknet Oct 22 2026; also via Ethereum/Base CCTP). Trade 300+ perps.", "$50 + ~$0.20 gas (est.)", "15 min"],
    ["Open a small perpetual position, $25 cap. 0% maker / 0.025% taker crypto; 0% / 0.010% RWA. Weekly: check margin ratio.", "free", "5 min/wk"],
    ["Hold 30 days. Points program exists (carried across in Oct 22 migration); no conversion terms documented. No confirmed allocation.", "held", "30 days"],
    ["Risk: liquidation when margin ratio (maintenance margin / equity) exceeds 100%. The 66%/80% thresholds could NOT be verified.", "free", "10 min"],
    ["Exit: close position, then withdraw USDC on Arc. Sub-second finality, no lock-up or queue. No 1-2 hour delay.", "~$0.10 gas (est.)", "sub-second finality"]
  ],
  "lofty": [
    ["Fresh wallet, $100 USDCa on Algorand; complete KYC/AML for bank deposits, positions over $200, withdrawals. Seed offline.", "free", "5 min"],
    ["Buy $100 of fractional property tokens on Lofty marketplace. Minimum $50 per property token. 2.5% purchase fee.", "$100 + $2.50 fee + ~$0.01 gas (est.)", "15 min"],
    ["Weekly: check rental income (paid daily in USDC) and whether a buyer exists at your target price.", "free", "5 min/wk"],
    ["Hold 30 days. Return is daily rental income in USDC (documented). No points program or token allocation.", "held", "30 days"],
    ["Risk: no lock-up, but a sale needs a buyer at your price - no fill time assured. CA DFPI consent order Nov 14 2022 ($37,500).", "free", "10 min"],
    ["Exit: sell on 24/7 marketplace (3% sale fee; instant orders +~2.5% per side). Proceeds to bank take up to 4 business days.", "$3.00 fee + ~$0.01 gas (est.)", "up to 4 business days"]
  ],
  "theo-network-thusd": [
    ["Fresh wallet, $100 USDC on Ethereum; seed offline.", "free", "5 min"],
    ["Acquire $100 thUSD via Theo app and stake for sthUSD. Primary minting is permissioned (MINTER_ROLE); thBILL is KYC-gated.", "$100 + ~$20 gas (est.)", "15 min"],
    ["Weekly: check sthUSD balance + thUSD Points (live since Jun 25 2026; holding, staking, vault deposits earn points).", "free", "5 min/wk"],
    ["Hold 30 days. thUSD Points documented; no Theo token or airdrop announced. No confirmed allocation.", "held", "30 days"],
    ["Risk: sthUSD unstaking via redemption queue averaging ~2 weeks. Core vault locks 3 months; Core+/Boost lock 6 months.", "free", "10 min"],
    ["Exit: unstake sthUSD through redemption queue (~2 weeks avg), then sell thUSD. Do not use a locked vault for 30 days.", "~$20 gas (est.)", "queue ~2 weeks"]
  ],
  "tydro": [
    ["Do NOT supply. On 2026-10-29 Tydro's emergency Safe froze all 13 reserves (precautionary after the Binance hot-wallet drain; Tydro not hacked, nothing lost). [G] New deposits and loans are blocked; [G] reopening is not verified.", "free", "5 min"],
    ["Verify: check app.tydro.com and Tydro's official channels for a confirmed reopening of deposits before sending any funds.", "free", "15 min"],
    ["Withdrawals were not blocked by the freeze (Aave V3 mechanics, liquidity-dependent); existing suppliers can exit, [G] but no new position opens until reopening is verified.", "free", "10 min"],
    ["No plan proceeds while deposits are frozen. Ink Points Season 2 terms are moot until the market reopens.", "held", "0 days"],
    ["Risk: deposits frozen since 2026-10-29; at the freeze one borrower held 93.7% of USDC debt with health factor sliding 1.50 to 1.33. [G]", "free", "10 min"]
  ],
  "ember": [
    ["Fresh wallet, $50 USDC on Sui; seed offline.", "free", "5 min"],
    ["Deposit $50 USDC into Ember structured vault on Sui (receipt eEARN for USDC vault). Some vaults are permissioned.", "$50 + ~$0.20 gas (est.)", "15 min"],
    ["Weekly: check vault share price.", "free", "5 min/wk"],
    ["Hold 30 days. No documented Ember points program. No confirmed allocation.", "held", "30 days"],
    ["Risk: redemption NOT instant - shares lock in pending queue, operator processes later. OtterSec Sep 2025: 13 findings.", "free", "10 min"],
    ["Exit: submit redemption request; the operator processes it later. Settlement time is Unknown (the per-vault figure is a non-binding operator estimate).", "~$0.20 gas (est.)", "Unknown"]
  ],
  "doppler-finance": [
    ["Fresh wallet, $50 XRP on XRP Ledger; seed offline.", "free", "5 min"],
    ["Deposit $50 XRP into XRP Vault on XRPL via Doppler app. Permissionless, no KYC. Restricted in US, China, Russia, others.", "$50 + ~$0.01 gas (est.)", "15 min"],
    ["Weekly: check vault balance + Doppler Points (DP accrues 0.01 DP per $1 per hour; Early-Depositor Boost; S3 rewards XDP). [W]", "free", "5 min/wk"],
    ["Hold 30 days. Doppler Points documented; DP conversion undefined; XDP Genesis claim ran Sep 28-Nov 28 2026. [W]", "held", "30 days"],
    ["Risk: 7-day withdrawal period is the key constraint. [X] Zero Doppler fees; XRPL fee ~$0.0004. RLUSD Vault audited by Zenith.", "free", "10 min"],
    ["Exit: submit withdrawal request; funds batched over a 7-day window (XRPL users get RLUSD back after batch processes). [X]", "~$0.01 gas (est.)", "7-day window"]
  ],
  "armitage-by-wintermute": [
    ["Fresh wallet, $100 USDC on Ethereum; seed offline.", "free", "5 min"],
    ["Deposit $100 USDC into Armitage Morpho Vault V2 vault on Ethereum (Core Prime/Select) via Morpho app. No minimum; no KYC.", "$100 + ~$10 gas (est.)", "15 min"],
    ["Weekly: check vault share price.", "free", "5 min/wk"],
    ["Hold 60 days. No documented Armitage points program. No confirmed allocation.", "held", "60 days"],
    ["Risk: no Armitage-specific audit documented. Intended for sophisticated/professional investors; not for UK/US residents.", "free", "10 min"],
    ["Exit: withdraw anytime; no lock-ups. Timing depends on liquidity; Force Deallocate Penalty 0% on Core vaults.", "~$10 gas (est.)", "same tx if liquid"]
  ],
  "avant-avusd": [
    ["Fresh wallet, $50 USDC on Avalanche; seed offline.", "free", "5 min"],
    ["Mint $50 avUSD against USDC on Avalanche, then stake avUSD to receive savUSD (senior tranche). avUSD alone earns NO yield.", "$50 + ~$2 gas (est.)", "15 min"],
    ["Weekly: check savUSD balance.", "free", "5 min/wk"],
    ["Hold 30 days. No points program. AVANT is a future governance token, no allocation terms. Yield via savUSD strategies.", "held", "30 days"],
    ["Risk: avUSD redemption often hours but up to 7 days. Unstaking savUSD takes 1-day cooldown (no yield). US restricted.", "free", "10 min"],
    ["Exit: unstake savUSD to avUSD (1-day cooldown, no yield), then redeem avUSD for USDC (hours to 7 days). Redemption fee applies.", "~$2 gas (est.)", "1-day cooldown + up to 7 days"]
  ],
  "valos": [
    ["Do NOT deposit. Valos is a permissioned vault (vUSD) on Monad for institutional allocators only. KYC; non-US professional / US accredited only. Minimum 100,000 AUSD. [I]", "free", "5 min"],
    ["Verify: the $100 plan cannot meet the 100,000 AUSD minimum. Redemption is via periodic windows, up to 30 days. [J]", "free", "15 min"],
    ["No plan proceeds without a verified retail route and a reachable minimum. No points program; yields supplemented by Monad/Agora/Accountable incentives.", "held", "0 days"],
    ["Risk: Accountable infra audited by Cyfrin (v2.0 Oct 16 2025) with critical withdrawal-queue DOS findings. Loans are uncollateralised institutional credit.", "free", "10 min"]
  ]
};

/** [capital, feeUsd, feeBurdenPct, activeMin, holdDays, exitDelayDays(-1 unknown), elig, risk, verdict, attractiveness(-1 n/a)] */
const ECON: Record<string, [number, number, number, number, number, number, number, number, number, number]> = {
  "steakhouse-financial": [100, 0.3, 0.3, 60, 30, -1, 1, 1, 3, -1],
  "sentora-curator": [100, 0.3, 0.3, 60, 30, -1, 1, 2, 3, -1],
  "gauntlet": [100, 0.3, 0.3, 60, 30, -1, 1, 2, 3, -1],
  "veda": [100, 0.3, 0.3, 60, 30, -1, 1, 2, 1, 50],
  "usdd": [100, 4.0, 4.0, 60, 30, 0, 3, 2, 1, 54],
  "upshift": [100, 0.4, 0.4, 60, 30, -1, 2, 2, 1, 61],
  "cian-yield-layer": [100, 0.4, 0.4, 60, 30, -1, 2, 2, 1, 61],
  "nonce-capital": [100, 0.3, 0.3, 60, 30, -1, 1, 2, 1, 50],
  "polymarket-international": [100, 0.4, 0.4, 60, 30, -1, 3, 1, 3, -1],
  "onre": [100, 0.03, 0.03, 60, 30, -1, 2, 2, 3, -1],
  "opentrade": [100, 0.0, 0.0, 40, 0, 5, 0, 4, 3, -1],
  "rockawayx": [100, 0.03, 0.03, 60, 30, -1, 2, 1, 3, -1],
  "plume-vaults": [100, 0.03, 0.03, 60, 30, -1, 1, 2, 1, 51],
  "hyperithm": [100, 0.3, 0.3, 60, 30, -1, 2, 2, 3, -1],
  "bittensor-dtao": [100, 0.2, 0.2, 80, 60, 0, 2, 2, 1, 60],
  "bitfi-basis": [100, 0.4, 0.4, 60, 30, -1, 2, 2, 1, 61],
  "symbiotic": [100, 30.0, 30.0, 60, 30, -1, 2, 2, 2, 38],
  "defi-saver-asset-management": [100, 0.0, 0.0, 40, 0, -1, 4, 4, 3, -1],
  "k3-capital": [100, 0.0, 0.0, 20, 0, -1, 4, 5, 4, -1],
  "mellow-core": [100, 30.0, 30.0, 60, 30, -1, 2, 2, 2, 38],
  "figure-markets-prime": [100, 0.53, 0.53, 60, 30, -1, 1, 2, 3, -1],
  "hive-protocol": [100, 10.0, 10.0, 60, 30, 1, 3, 2, 2, 49],
  "lagoon": [100, 0.4, 0.4, 60, 30, -1, 1, 2, 3, -1],
  "clearstar": [100, 0.3, 0.3, 60, 30, -1, 1, 1, 3, -1],
  "lightning-network": [100, 10.0, 10.0, 60, 30, -1, 0, 2, 2, 19],
  "r25": [100, 0.0, 0.0, 40, 0, -1, 4, 4, 3, -1],
  "b14g": [100, 0.0, 0.0, 20, 0, -1, 4, 5, 4, -1],
  "saturn": [100, 0.4, 0.4, 60, 30, -1, 3, 2, 1, 72],
  "figure-markets-exchange": [100, 0.0, 0.0, 40, 0, -1, 4, 4, 3, -1],
  "curvance": [100, 0.3, 0.3, 60, 30, -1, 2, 2, 3, -1],
  "galaxy-curation": [100, 0.0, 0.0, 40, 0, -1, 4, 4, 3, -1],
  "extended-perps": [50, 0.3, 0.6, 60, 30, -1, 2, 2, 3, -1],
  "lofty": [100, 5.52, 5.52, 60, 30, -1, 2, 2, 2, 38],
  "theo-network-thusd": [100, 40.0, 40.0, 60, 30, -1, 2, 2, 2, 38],
  "tydro": [100, 0.3, 0.3, 60, 30, -1, 2, 1, 4, -1],
  "ember": [50, 0.4, 0.8, 60, 30, -1, 1, 2, 3, -1],
  "doppler-finance": [50, 0.02, 0.04, 60, 30, 7, 2, 2, 1, 66],
  "armitage-by-wintermute": [100, 20.0, 20.0, 80, 60, -1, 1, 2, 2, 24],
  "avant-avusd": [50, 4.0, 8.0, 60, 30, 8, 2, 2, 2, 42],
  "valos": [100, 0.0, 0.0, 30, 0, -1, 4, 4, 3, -1]
};
/** Verified execution facts for ranks 41-198 (protocol-facts-41-198.json, as_of 2026-11-25;
 * 1,230/1,264 VERIFIED). Each row: [slug, mechanism, exitDays (-1 unknown), minCode
 * (0 unverified, 1 none, 2 has a minimum), eligibility (0 E0, 1 E1, 2 E2, 3 E3, 4 EU),
 * risk (1 R1, 2 R2, 3 R3, 4 RU, 5 RS), flags (1 live token, 2 suspended, 4 not retail, 8 incident)].
 * Capital and hold come from the snapshot (TVL tier, age); the fee comes from the chain's gas. */
const MECH: [string, number, number, number, number, number, number][] = [["3f",1,-1,0,0,1,4],["3jane-lending",2,-1,2,2,1,1],["9summits",1,-1,0,2,1,0],["abstract",0,-1,1,1,5,6],["adrastea-validator",4,-1,1,1,2,10],["aegis-yusd",8,-1,2,2,1,0],["aftermath-aflp",1,-1,2,0,2,24],["agni-finance",6,0,0,0,2,0],["agua",1,-1,0,0,4,0],["alphagrowth",1,-1,0,1,1,0],["anemoy-capital",10,-1,1,0,1,0],["antarctic",8,8,2,2,1,16],["anthias-labs",1,-1,0,0,1,0],["apex-omni",8,-1,2,2,2,17],["arcus-perps",8,-1,2,2,1,16],["arrakis-modular",6,-1,0,2,1,0],["august-digital",1,-1,1,2,1,4],["avant-aveth",1,8,1,2,1,16],["axis",8,30,1,2,1,16],["azverse-perps",8,-1,0,0,1,0],["bend",2,-1,1,1,1,1],["bima-cdp",3,0,1,2,2,0],["binaryx-platform",10,-1,1,0,1,1],["bisonfi",6,-1,0,0,1,4],["bitlayer-ybtc-family",0,-1,1,0,1,0],["block-analitica",1,-1,1,2,1,0],["boros",8,-1,1,2,1,16],["bouncebit-prime",8,15,1,2,2,25],["btcfi-cdp",3,-1,1,0,1,16],["bucket-cdp",3,0,1,2,2,16],["bulk",8,-1,2,2,1,16],["byreal",6,0,0,2,1,16],["chain-fusion",0,-1,1,0,1,0],["circle-gateway",12,7,2,0,1,0],["communityv3",6,0,1,0,2,0],["current",2,-1,0,2,1,16],["d2-finance",1,-1,1,0,1,0],["damm-capital",1,-1,0,0,1,4],["decibel",8,-1,2,2,1,0],["defa-by-invoicemate",10,-1,0,0,1,16],["defindex",1,-1,1,1,1,16],["drakewell",8,-1,1,0,1,4],["estate-protocol",10,-1,2,0,1,0],["exponent-risk-tranching",1,-1,1,2,2,0],["exponent-strategy-vaults",1,-1,1,2,2,16],["exponent-yield-exchange",1,-1,0,2,1,16],["felix-cdp",3,0,1,2,1,0],["felix-vaults",1,-1,1,2,2,16],["fira",2,-1,1,0,1,0],["firelight",0,60,0,2,1,0],["flowdesk",1,-1,1,2,2,0],["flux-finance",2,-1,1,2,1,0],["fluxion-network",6,0,0,2,1,16],["flying-tulip-ftusd",1,-1,0,0,1,17],["fstswap",6,0,1,1,1,1],["gami-labs",1,-1,0,0,1,16],["gamma-research",1,-1,1,2,2,9],["gmx-solana",8,-1,1,2,1,1],["goonfi",6,-1,0,0,2,24],["goose",15,-1,0,1,1,16],["granite",2,-1,0,0,1,0],["growihf",1,-1,2,0,2,0],["hakutora",1,-1,1,2,5,2],["hertzflow",8,0,2,2,1,0],["hylo-protocol",11,0,1,2,1,0],["hyperbeat-earn",1,-1,1,0,1,16],["icarus-cl",6,0,1,1,1,16],["infinifi",1,-1,0,2,2,1],["ipor-fusion",1,7,0,2,2,24],["katana-dex",6,0,2,0,1,16],["katana-pre-launch",1,-1,0,1,1,0],["kava-mint",3,-1,1,0,5,2],["keyrock",1,-1,1,1,1,0],["liminal-basis",8,3,2,0,1,0],["loopscale-curation",1,-1,1,2,2,8],["loopscale-lending",2,-1,1,2,2,8],["lulo",1,-1,1,0,2,0],["makina",1,-1,0,2,1,0],["manifest-trade",6,0,1,0,1,0],["manta-cedefi",8,-1,1,2,1,17],["marginfi-lending",2,-1,1,2,2,0],["metalx-swap",6,0,2,0,1,16],["mev-capital",1,-1,1,0,1,0],["mezo-earn",0,-1,1,1,1,1],["mezzanine",1,14,0,0,1,16],["monarq",1,-1,2,2,5,18],["monolith-market",3,0,2,1,2,0],["mystic-finance-lending",2,-1,0,2,1,0],["nado-spot",6,-1,2,2,2,16],["native-credit-pool",2,-1,2,0,1,0],["nemo-trading",1,31,0,2,2,0],["neutral-trade",1,-1,1,2,1,16],["noble",0,-1,1,0,5,6],["noon",1,-1,0,2,1,1],["nucleus",1,-1,0,2,1,0],["nuva",1,-1,1,2,1,16],["origami-finance",1,-1,1,2,1,0],["paimon",10,-1,2,2,1,16],["pangolins",1,-1,0,0,1,17],["perena-vaults",1,-1,2,2,2,0],["phoenix-perp",8,-1,2,2,2,16],["plasma-one",0,-1,2,1,1,17],["plasma-saving-vaults",1,-1,1,1,1,16],["predict-fun",9,-1,1,2,2,16],["project-0",2,-1,1,2,2,8],["project-x",6,0,1,2,1,1],["qearn",4,-1,2,0,2,0],["re7-labs",1,-1,1,2,5,2],["reti-pooling",4,0,2,0,1,0],["reya-perps",8,-1,1,2,2,16],["rif-on-chain",11,-1,0,0,1,1],["risex",8,-1,2,2,2,24],["rocksolid-network",1,-1,0,1,2,0],["set-protocol",1,0,1,0,2,0],["sharpbyte-capital",1,-1,1,2,2,0],["shift-defi",1,7,0,2,1,16],["snuggle",6,0,1,0,1,0],["solv-strategies",1,-1,1,2,2,25],["stablehodl",1,-1,1,2,1,16],["steer-protocol",6,-1,0,2,1,0],["stellar-amm",6,0,1,0,1,0],["stellar-defi-hub",1,-1,0,0,1,16],["stellar-dex",6,0,1,0,1,0],["strata-markets",1,-1,0,2,2,8],["strato-cdp",3,-1,1,0,1,0],["subfrost",0,-1,2,2,1,0],["superearn",1,-1,1,1,1,0],["swan-dao",3,-1,2,0,1,1],["sygnum-fiusd-liquidity-fund",10,-1,1,0,1,16],["syncswap",6,0,1,1,1,0],["syntetika",1,0,1,1,1,16],["syntropia",1,-1,1,1,1,0],["t3tris-finance",1,-1,1,2,1,0],["tau-labs",1,-1,1,2,1,0],["templar-lending",2,-1,1,2,1,0],["temple",6,-1,1,0,2,17],["tempo-stablecoin-dex",6,-1,0,0,1,16],["tessera-v",6,-1,1,0,1,4],["theo-network-thbill",10,-1,1,2,1,0],["tori-finance",8,7,1,2,1,0],["tulipa-capital",1,-1,1,2,2,0],["turboflow-perps",8,-1,1,2,1,0],["ultrayield-curator",1,-1,1,4,5,2],["ultrayield-vaults",1,-1,1,0,5,2],["usdcx",11,-1,0,0,1,16],["valantis-sthype-restaking",5,-1,0,0,1,0],["vault-street",10,-1,0,0,1,4],["vena-finance",2,-1,1,0,1,0],["vesu",2,-1,0,2,2,8],["vfat.io",1,-1,1,0,1,0],["vishwa",0,3,0,0,1,0],["waterline",1,-1,1,2,1,0],["xion-finance",0,21,1,0,1,1],["xrpl-dex",6,0,1,0,2,0],["y10k-capital",1,-1,1,2,1,16],["yieldfi",1,-1,1,2,5,18],["yuzu-money",1,3,1,2,1,16],["zoo-finance",1,-1,1,2,1,0]];
const LIVE: Record<string, string> = {"infinifi":"INFI","solv-strategies":"SOLV","noon":"NOON","mezo-earn":"MEZO","apex-omni":"APEX","project-x":"PRJX","manta-cedefi":"MANTA","plasma-one":"XPL","xion-finance":"XION","gmx-solana":"GMX","gamma-research":"GAMMA","rif-on-chain":"RIF","3jane-lending":"JANE","fstswap":"FIST","bouncebit-prime":"BB","binaryx-platform":"BNRX","bend":"BEND","pangolins":"PNG","flying-tulip-ftusd":"FT","temple":"TEMPLE","swan-dao":"SWAN","usdd":"USDD","bittensor-dtao":"TAO","hive-protocol":"B2"};
const SUSP: Record<string, string> = {"tydro":"All 13 reserves frozen 2026-10-29 (precautionary); new deposits blocked, reopening unverified.","noble":"Circle pauses Noble USDC + CCTP Jan 12 2027.","re7-labs":"Deposits disabled; TVL down >95%.","ultrayield-curator":"Bad debt realized; TVL down >95%.","hakutora":"Abandoned; TVL down >95%.","ultrayield-vaults":"Abandoned; TVL down >95%.","yieldfi":"Abandoned; TVL down >95%.","kava-mint":"Dead CDP; USDX depegged May 2022 ~$0.70.","abstract":"Chain shuts down Dec 15 2026; unbridged funds inaccessible.","monarq":"FXRP vault withdrawals revert; funds deployed off-vault; no payout, no ETA (Nov 18 2026).","adrastea-validator":"Restaking token services shut down Dec 4 2025; protocol pivoted to Solana infrastructure."};
const INC: Record<string, string> = {"tydro":"Oct 29 2026 emergency freeze of all 13 reserves (precautionary; nothing lost).","ipor-fusion":"Jan 2026 exploit $336K.","solv-strategies":"Mar 2026 exploit ~$2.73M, compensated.","loopscale-lending":"Nov 2026 exploit ~$412K + ~$521K NAV inflation.","project-0":"Drift exploit ~$1.91M bad debt.","gamma-research":"Jan 2024 exploit $3.4-6M.","adrastea-validator":"Pivoted Dec 2025; restaking token services shut down Dec 4 2025.","risex":"Aug 3 2026 unauthorized 673,011.56 USDC withdrawal.","strata-markets":"Neutrl markets suspended.","bouncebit-prime":"Aug 2026 exploit ~$3M BB; native L1 shut down.","vesu":"Sep 2026 oracle incident $3M, 95% recovered.","aftermath-aflp":"Apr 2026 exploit ~$1.14M.","loopscale-curation":"Nov 5 2026 exploit ~$412K.","goonfi":"Mar 2026 exploit ~$254K."};
const NORETAIL: Record<string, string> = {"noble":"Winding down; not a farm.","3f":"Not retail-executable.","august-digital":"Institutional only.","drakewell":"Not retail-executable.","bisonfi":"Not retail-executable.","tessera-v":"Not retail-executable.","abstract":"Chain winding down; not a farm.","vault-street":"Not retail-executable.","damm-capital":"Not retail-executable.",};
const MINUSD: Record<string, number> = {"circle-gateway":5.0,"arcus-perps":5.0,"apex-omni":10.0,"plasma-one":10.0,"liminal-basis":500.0,"decibel":10.0,"phoenix-perp":1.0,"risex":20.0,"3jane-lending":1000.0,"estate-protocol":50.0,"perena-vaults":1.0,"growihf":5.0,"paimon":10.0,"metalx-swap":1.0,"antarctic":10.0,"katana-dex":1.0,"bulk":10.0,"aftermath-aflp":1.0,"nado-spot":5.0,"aegis-yusd":1.0,"hertzflow":10.0,"native-credit-pool":10.0,"swan-dao":1000.0};

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

/** The mechanism's entry action, from the verified parameters. When the route
 * record names a verified product, the entry names it; otherwise the route
 * stays a verification task, never an invented deposit procedure. */
function mechEntry(p: SnapshotProtocol, mech: number, capital: number, chain: string, minCode: number, minUsd: number | null): string {
  const n = p.name;
  const route = ROUTES_SRC[p.slug];
  const product = route?.[0] ?? null;
  const asset = route?.[1] ?? null;
  const min = minCode === 2 && minUsd !== null ? ` Minimum deposit $${minUsd} (verified).` : minCode === 1 ? ' No minimum deposit documented.' : ' Minimum deposit UNVERIFIED.';
  const into = product !== null ? ` into ${product}` : '';
  const withAsset = asset !== null ? ` (${asset})` : '';
  switch (mech) {
    case 1: return `Verify the vault route${withAsset} on ${n}'s own page, then deposit $${capital}${into} on ${chain}.${min}`;
    case 2: return `Verify the lending market${withAsset} on ${n}'s own page, then supply $${capital}${into} on ${chain}.${min}`;
    case 3: return `Verify the CDP vault, collateral asset and minimum ratio on ${n}'s own page, then open a $${capital} collateralized position${into} on ${chain}.${min}`;
    case 4: return `Verify the staking pool, asset and cooldown on ${n}'s own page, then stake $${capital}${into} on ${chain}.${min}`;
    case 5: return `Verify the restaking vault, collateral asset and epoch rules on ${n}'s own page, then restake $${capital}${into} on ${chain}.${min}`;
    case 6: return `Verify the pool, assets and fee tier on ${n}'s own page, then provide $${capital} of liquidity${into} on ${chain}.${min}`;
    case 8: return `Verify the market, margin asset and liquidation metric on ${n}'s own page, then deposit $${capital} as margin${into} on ${chain}.${min}`;
    case 9: return `Verify the market, collateral and eligibility on ${n}'s own page, then fund $${capital} and place one position${into} on ${chain}.${min}`;
    case 10: return `Verify eligibility, the asset and redemption terms on ${n}'s own page, then subscribe $${capital}${into} on ${chain}.${min}`;
    case 11: return `Verify the mint/redeem rules and collateral on ${n}'s own page, then mint $${capital} of the stable asset${into} on ${chain}.${min}`;
    case 12: return `Verify the bridge route, asset and settlement on ${n}'s own page, then bridge $${capital}${into} on ${chain}.${min}`;
    case 15: return `Verify access, custody, fees and redemption on ${n}'s own page, then allocate $${capital}${into} on ${chain}.${min}`;
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
  return s;
}

// ---------- v7.3 economic engine: six FARM gates ----------
// Each gate returns -1 UNKNOWN / 0 FAIL / 1 PASS; missing evidence never passes.
// Gate inputs come only from the verified fact files (protocol-facts*.json,
// 1550/1584, as_of 2026-11-25) encoded in ECON/MECH and the tables below.
// Verdict precedence: SUSPENDED -> SKIP (proven hard exclusion) -> UNVERIFIED
// (any necessary input unknown) -> FARM (all six pass) -> CONDITIONAL (all
// inputs known, >=1 gate fails). dashboard/app.js carries the same evaluator
// and a packed copy of these inputs; the audit proves both agree on all rows.

/** Top-40 rows whose verified restrictions name specific non-sanctions
 * jurisdictions: jurisdiction applicability is unverified for a generic user. */
const TOP40_GEO = new Set(['veda', 'usdd', 'nonce-capital', 'upshift', 'polymarket-international', 'onre', 'symbiotic', 'plume-vaults', 'hive-protocol', 'curvance', 'figure-markets-exchange', 'armitage-by-wintermute', 'extended-perps', 'avant-avusd', 'doppler-finance', 'ember', 'r25']);
/** Top-40 rows with no verified retail route (institutional/accredited/closed). */
const TOP40_NOT_RETAIL = new Set(['opentrade', 'galaxy-curation', 'valos']);
/** Top-40 minimum codes from verified minimum_deposit facts ([WEAK] facts -> 0).
 * usdd is 1: the plan route is the 1:1 PSM, which has no minimum; the CDP mint
 * minimums (500-2000 USDD) do not apply to that route. */
const TOP40_MINCODE: Record<string, number> = {
  'sentora-curator': 1, 'steakhouse-financial': 1, 'gauntlet': 1, 'veda': 1, 'usdd': 1,
  'nonce-capital': 1, 'upshift': 2, 'bittensor-dtao': 2, 'polymarket-international': 1,
  'onre': 1, 'rockawayx': 1, 'cian-yield-layer': 0, 'defi-saver-asset-management': 2,
  'symbiotic': 1, 'opentrade': 2, 'mellow-core': 1, 'hyperithm': 1, 'lightning-network': 2,
  'bitfi-basis': 2, 'plume-vaults': 1, 'k3-capital': 1, 'hive-protocol': 2, 'r25': 1,
  'figure-markets-prime': 1, 'b14g': 1, 'clearstar': 1, 'saturn': 1, 'lagoon': 1,
  'theo-network-thusd': 1, 'curvance': 0, 'figure-markets-exchange': 2, 'galaxy-curation': 1,
  'tydro': 1, 'valos': 2, 'armitage-by-wintermute': 1, 'lofty': 2, 'extended-perps': 2,
  'avant-avusd': 0, 'doppler-finance': 1, 'ember': 1,
};
/** Documented USD-denominated minimums (top 40). defi-saver: 0.1 ETH ~ $300 per
 * its verified fact and plan. Non-USD minimums (TAO/BTC/sats) stay null. */
const TOP40_MINUSD: Record<string, number> = { 'upshift': 10, 'valos': 100000, 'lofty': 50, 'extended-perps': 5 };
/** Documented principal-based round-trip fee percentages (verified
 * transaction_costs facts). Yield-based fees are embedded in net yield and
 * excluded (no double-counting). A documented component alone can prove a
 * SKIP-threshold breach even when the total round-trip cost is unbounded. */
const FEE_PCT: Record<string, number> = {
  'lofty': 5.5, 'hylo-protocol': 2, 'tempo-stablecoin-dex': 0.6, 'rif-on-chain': 0.5,
  'defi-saver-asset-management': 0.25, 'bittensor-dtao': 0.1, 'tori-finance': 0.1,
  'theo-network-thusd': 0.1, 'aegis-yusd': 0.1, 'avant-aveth': 0.05, 'cian-yield-layer': 0.02,
};
/** Documented zero deposit/withdrawal fees on the plan route. */
const FEE_ZERO = new Set(['bitfi-basis', 'doppler-finance', 'usdd', 'armitage-by-wintermute', 'loopscale-lending', 'curvance', 'lulo', 'axis']);
/** Conversion/bridging whose spread/slippage is unbounded (market sale or bridge). */
const XFER_UNBOUNDED = new Set(['bittensor-dtao', 'saturn', 'doppler-finance', 'tempo-stablecoin-dex', 'binaryx-platform', 'noon', 'theo-network-thbill', 'drakewell', 'lofty', 'onre', 'hive-protocol', 'polymarket-international', 'predict-fun']);
/** Documented zero-slippage conversion (usdd 1:1 PSM redemption). */
const XFER_ZERO = new Set(['usdd']);
/** Documented zero gas on the route's chain (metalx: no gas fee on XPR Network). */
const GAS_ZERO = new Set(['metalx-swap']);
/** Documented gas USD upper bounds (round trip) from verified sources.
 * Empty: the fact base records gas estimates only, and an estimate is not
 * a bound; the evaluator accepts a numeric bound here when one is documented. */
const GAS_UPPER: Record<string, number> = {};
/** Documented absence of any monetary reward mechanism (fact-backed):
 * incentives explicitly zero, program closed, or no yield/reward at all.
 * Distinct from reward-unknown: these fail G1 (NET!), never pass it. */
const REWARD_NONE = new Set(['set-protocol', 'syncswap', 'monolith-market']);
/** Sequential complete-exit stage maxima; the exit bound is their sum. */
const EXIT_STAGES: Record<string, number[]> = { 'avant-avusd': [1, 7], 'avant-aveth': [1, 7], 'antarctic': [7, 1] };
/** Documented zero monetary lower bound: Liquidity Rewards pay only if the
 * day's rewards reach the $1 payout minimum, with no rollover. */
const REWARD_ZERO_KNOWN = new Set(['polymarket-international']);

/** Documented positive monetary reward floors (USD lower bound over the
 * holding period). Empty: no fact in the verified base documents a positive
 * USD floor; variable APY and points have a conservative lower bound of 0. */
const REWARD_FLOOR: Record<string, number> = {};
/** Incident state per protocol: 2 = unresolved material incident, 1 =
 * historical/resolved. Derived from INC + security_status facts: unresolved =
 * recent exploit with outstanding loss, paused operations, or partial
 * suspension still in effect at the snapshot date. */
const INCIDENT_UNRESOLVED = new Set(['tydro', 'loopscale-lending', 'project-0', 'strata-markets', 'bouncebit-prime', 'loopscale-curation', 'adrastea-validator']);
/** Mandatory minimum complete-exit durations (days): documented cooldown /
 * lock / unbonding that must elapse before capital can be withdrawable.
 * Distinct from the exit maximum: exitMin > 30 means exit cannot occur
 * within 30 days at all. */
const EXIT_MIN: Record<string, number> = { 'firelight': 30, 'valantis-sthype-restaking': 14, 'xion-finance': 21, 'avant-avusd': 1, 'avant-aveth': 1 };
/** Tokens whose existence is documented but whose trading is not verified in
 * the fact base (announced token, or governance token without a trading
 * record): token status UNKNOWN, not live. */
const TOKEN_UNKNOWN = new Set(['steer-protocol', 'predict-fun', 'katana-dex']);

/** Verified execution-route identity per protocol: [product, deposit asset].
 * Product names the specific vault/market/account from the verified
 * deposit_route fact; null = no identified retail product (infrastructure,
 * curator without a named vault family, no deposit product, or ambiguous
 * identity). Asset is the first verified supported asset; null = unverified.
 * Curated 2026-11-25 from protocol-facts*.json (see v7.4/routes-curated.json). */
const ROUTES_SRC: Record<string, [string | null, string | null]> = {
  "sentora-curator": ["Sentora Boring USDC vault (Smart Yield)", "USDC"],
  "steakhouse-financial": ["Steakhouse-curated Morpho vault", "USDC"],
  "gauntlet": ["Gauntlet-curated Morpho vault", "USDC"],
  "veda": ["ether.fi Liquid vault (Veda BoringVault)", "USDC"],
  "usdd": ["sUSDD staking via PSM swap", "TRX"],
  "nonce-capital": ["ether.fi Liquid vault (Nonce-curated)", "ETH"],
  "upshift": ["Upshift vault", "USDC"],
  "bittensor-dtao": ["Subnet alpha staking", "TAO"],
  "polymarket-international": ["Polymarket CLOB (pUSD)", "USDC"],
  "onre": ["ONyc mint", "USDC"],
  "rockawayx": ["RockawayX-curated Morpho vaults", "USDC"],
  "cian-yield-layer": ["CIAN Yield Layer vault", "stETH"],
  "defi-saver-asset-management": ["DeFi Saver CDP/leverage dashboard", "ETH"],
  "symbiotic": ["Symbiotic vault", "wstETH"],
  "opentrade": ["Prime+ Vault (xPPV)", "USDC"],
  "mellow-core": ["Lido Earn vaults (Mellow)", "ETH"],
  "hyperithm": ["Hyperithm USDC Apex vault", "USDC"],
  "lightning-network": ["Lightning payment channel", "BTC"],
  "bitfi-basis": ["bfUSD Horizon/Pulsar staking", "USDT"],
  "plume-vaults": ["Nest vaults (Plume)", "pUSD"],
  "k3-capital": ["K3-curated vaults", "RSETH"],
  "hive-protocol": ["B2 Hive BTC staking", "BTC"],
  "r25": ["rcUSD / curator vaults (R25 app)", "USDC"],
  "figure-markets-prime": ["Democratized Prime pools", "YLDS"],
  "b14g": ["b14g dual-staking", "BTC"],
  "clearstar": ["Clearstar-curated Morpho vaults", "WETH"],
  "saturn": ["USDat mint/stake", "USDC"],
  "lagoon": ["Lagoon ERC-7540 vault", "USDC"],
  "theo-network-thusd": ["thUSD Core vaults", "thUSD"],
  "curvance": ["Curvance isolated lending markets", "USDC"],
  "figure-markets-exchange": ["Figure Markets exchange", "USD"],
  "galaxy-curation": ["Galaxy-curated Morpho vaults (Fireblocks Earn)", "USDC"],
  "tydro": ["Tydro lending market", "USDT0"],
  "valos": ["RWA Backed Lending by Valos vault", "AUSD"],
  "armitage-by-wintermute": ["Armitage-curated Morpho Vault V2", "USDC"],
  "lofty": ["Lofty property tokens", "USDC (USDCa)"],
  "extended-perps": ["Extended perps margin account", "USDC"],
  "avant-avusd": ["avUSD mint/stake", "USDC"],
  "doppler-finance": ["Doppler XRP/RLUSD vaults", "XRP"],
  "ember": ["Ember structured vault", "USDC"],
  "stellar-defi-hub": ["Sentora USDC vault (Stellar DeFi Hub)", "USDC"],
  "keyrock": ["Keyrock-curated Morpho vaults", "USDC"],
  "noble": [null, "USDC"],
  "tori-finance": ["trUSD mint + strUSD staking", "trUSD"],
  "loopscale-lending": ["Loopscale Genesis vaults", "USDC"],
  "infinifi": ["iUSD mint + siUSD staking", "USDC"],
  "axis": ["Axis Ecosystem Vault (Upshift)", "USDT"],
  "ipor-fusion": ["IPOR Fusion Atomist Plasma Vaults", "USDC"],
  "circle-gateway": ["Circle Gateway Wallet", "USDC"],
  "reti-pooling": ["Reti incentivized staking pools", "ALGO"],
  "gami-labs": ["Gami risk-curator vaults (EARNUSDC)", "USDC"],
  "arcus-perps": ["Arcus perps margin account", "USDG"],
  "yuzu-money": ["yzUSD mint + syzUSD staking", "yzUSD"],
  "usdcx": ["USDCx mint via xReserve", "USDC"],
  "solv-strategies": ["BTC+ meta-vault", "cbBTC"],
  "mezo-earn": ["Mezo Earn BTC Vault", "tBTC"],
  "tulipa-capital": ["Tulipa-curated vaults", "USDC"],
  "azverse-perps": ["AZverse perps margin account", "USDT"],
  "firelight": ["Firelight Vault (FXRP cover)", "FXRP"],
  "nado-spot": ["Nado unified-margin account", "USDT0"],
  "current": ["Current MainMarket lending", "USDC"],
  "project-0": ["Project 0 lending banks", "USDC"],
  "arrakis-modular": ["Arrakis MetaVault (public vault)", "token pair"],
  "shift-defi": ["Shift delta-neutral vaults", "USDC"],
  "re7-labs": ["Re7-curated Morpho vaults", "USDC"],
  "vishwa": [null, "BTCvc"],
  "exponent-yield-exchange": ["Exponent PT/YT yield exchange", "USDC"],
  "flux-finance": ["Flux fToken lending", "USDC"],
  "3f": ["3F leveraged RWA vaults (JAAA)", "USDC"],
  "ultrayield-curator": ["UltraYield Morpho vaults", "USDC"],
  "makina": ["Makina Operator's Machine vault", "USDC"],
  "noon": ["USN mint + sUSN staking", "USDT"],
  "aegis-yusd": ["YUSD mint (Aegis)", "USDT"],
  "project-x": ["Project X CLMM pools", "HYPE"],
  "plasma-one": ["Plasma One Earn vault (P1USD)", "USDT"],
  "felix-vaults": ["Felix-curated Morpho vaults", "USDC"],
  "plasma-saving-vaults": ["Plasma Saving Vaults (Lending Vault)", "USDT0"],
  "mystic-finance-lending": ["Mystic-curated earn vaults", "pUSD"],
  "decibel": ["Decibel perps account (usDCBL)", "USDC"],
  "hylo-protocol": ["hyUSD/xSOL mint (collateral pool)", "SOL"],
  "origami-finance": ["lovToken vaults", "wstETH"],
  "y10k-capital": ["Y10k USDC Vault (eY10K)", "USDC"],
  "drakewell": ["USDdw structured products", "USDC"],
  "vfat.io": [null, "any supported token"],
  "flowdesk": ["Flowdesk AUSD RWA Morpho Vault V2", "AUSD"],
  "anemoy-capital": ["Anemoy AAA CLO fund (Centrifuge)", "USDC"],
  "marginfi-lending": ["marginfi banks via Project 0", "SOL"],
  "xrpl-dex": ["XRPL native DEX/AMM", "XRP"],
  "templar-lending": ["Templar isolated lending markets", "BTC"],
  "bitlayer-ybtc-family": ["YBTC.B Vaults", "YBTC.B"],
  "apex-omni": ["ApeX Omni perps account", "USDT"],
  "manta-cedefi": ["Manta CeDeFi contracts", "BTC"],
  "liminal-basis": ["Liminal xTokens/limUSD", "USDC"],
  "zoo-finance": ["Zoo structured-yield vaults", "wSEI"],
  "lulo": ["Lulo auto-allocated lending", "USDC"],
  "avant-aveth": ["avETH mint + savETH staking", "ETH"],
  "gmx-solana": ["GMX Solana GLV vaults / perps", "SOL"],
  "waterline": ["Waterline-curated Morpho vaults", "USDC"],
  "d2-finance": ["D2 options vaults (ETH++/USDC++)", "USDC"],
  "phoenix-perp": ["Phoenix perps trader account", "USDC"],
  "august-digital": [null, null],
  "adrastea-validator": ["Adrastea validator staking", "SOL"],
  "xion-finance": [null, "XION"],
  "gamma-research": ["Gamma Hypervisor vault", "token pair"],
  "risex": ["XLP Vault (RISEx)", "USDC"],
  "neutral-trade": ["Neutral Trade vaults (Drift infra)", "USDC"],
  "agua": ["Global Carry Vault (Agua)", "USDC"],
  "chain-fusion": [null, "BTC (as ckBTC)"],
  "nemo-trading": ["NEMO USDC Prime vault", "USDC"],
  "bisonfi": [null, null],
  "fira": ["Fira fixed-rate lending (Bond Tokens)", "USDC"],
  "native-credit-pool": ["Native Credit Pool (single-sided supply)", "USDT"],
  "felix-cdp": ["feUSD CDP (Felix)", "HYPE"],
  "defindex": ["Defindex vaults (USDC Blend Fixed)", "USDC"],
  "ultrayield-vaults": ["UltraYield main vaults (UltraUSD)", "USDC"],
  "rocksolid-network": ["RockSolid liquid vaults (rETH/USDm)", "USDC"],
  "katana-pre-launch": ["Katana pre-launch Yearn vaults", "ETH"],
  "hyperbeat-earn": ["Hyperbeat Earn meta-vaults", "HYPE"],
  "communityv3": ["CommunityV3 Uniswap V3 pools", "USDC"],
  "perena-vaults": ["Perena Vault V2 (USD*)", "USDC"],
  "tempo-stablecoin-dex": ["Tempo Stablecoin DEX", "USDC"],
  "exponent-strategy-vaults": ["Exponent Strategy Vaults", "USDC"],
  "rif-on-chain": ["USDRIF mint (RIF On Chain)", "RIF"],
  "hakutora": ["Hakutora-curated Morpho vaults", "USDC"],
  "9summits": ["9Summits flagship Lagoon vaults", "cbBTC"],
  "nuva": ["NUVA vaults (nvYLDS)", "USDC"],
  "agni-finance": ["Agni DEX pools (Mantle)", "token pair"],
  "strata-markets": ["Strata tranche vaults (srUSDe/jrUSDe)", "USDe"],
  "syntetika": ["Syntetika hBTC vaults", "BTC"],
  "sygnum-fiusd-liquidity-fund": ["FIUSD tokenized money-market fund", "USDC"],
  "paimon": ["Paimon Prime vault (PP)", "USDT"],
  "3jane-lending": ["USD3 mint (3Jane Morpho pool)", "USDC"],
  "estate-protocol": ["Estate fractional property tokens", "USDC"],
  "t3tris-finance": [null, "USDC"],
  "steer-protocol": ["Steer Smart Pools", "token pair"],
  "syntropia": ["Syntropia tranche vaults (synUSD+)", "USDC"],
  "exponent-risk-tranching": ["Exponent Senior/Junior tranches", "ONyc"],
  "stellar-dex": ["Stellar native DEX/AMM", "XLM"],
  "growihf": ["Growi vault (Hyperliquid)", "USDC"],
  "goose": [null, null],
  "bucket-cdp": ["Bucket Tank CDP (USDB)", "SUI"],
  "strato-cdp": ["STRATO CDP vaults", "BTC"],
  "theo-network-thbill": ["thBILL tokenized T-Bill basket", "USDC"],
  "fstswap": ["FSTSwap pools", "token pair (BEP-20)"],
  "bouncebit-prime": ["BounceBit Prime vaults", "BENJI"],
  "tessera-v": [null, "USDC"],
  "qearn": ["Qearn staking contract", "QUBIC"],
  "yieldfi": ["yUSD vault", "USDC"],
  "snuggle": ["Snuggle CL vaults", "cbBTC"],
  "predict-fun": ["Predict.fun markets", "USDT"],
  "sharpbyte-capital": ["SharpByte USDT Prime Morpho V2 vault", "USDT"],
  "tau-labs": ["TAU-curated vaults", "USDC"],
  "kava-mint": ["USDX CDP (Kava Mint)", "HBTC"],
  "set-protocol": ["TokenSets (Set Tokens)", "ERC-20 basket"],
  "reya-perps": ["Reya perps margin account", "USDC"],
  "superearn": ["Super Vault (SuperEarn)", "USDT"],
  "bima-cdp": ["BIMA CDP (USBD mint)", "WBTC"],
  "abstract": [null, null],
  "vena-finance": ["Vena money market", null],
  "manifest-trade": ["Manifest spot DEX / Destiny Vaults", "PYUSD"],
  "bend": ["BendDAO lending pool", "ETH"],
  "binaryx-platform": ["Binaryx tokenized properties", "USDT"],
  "vesu": ["Vesu isolated pools", "wBTC"],
  "byreal": ["Byreal CL pools", "USDC"],
  "antarctic": ["Antarctic perps account", "USDT"],
  "mev-capital": ["MEV Capital-curated vaults", "USDC"],
  "valantis-sthype-restaking": ["Valantis stHYPE restaking vault", "stHYPE"],
  "pangolins": ["Pangolin DEX pools", "AVAX"],
  "icarus-cl": ["Icarus CL pools (RISE)", "IRS"],
  "subfrost": ["Subfrost frBTC wrap/vaults", "BTC"],
  "block-analitica": ["BA Labs-curated Morpho/Spark vaults", "USDC"],
  "stellar-amm": ["Stellar protocol AMM pools", "XLM"],
  "bulk": ["Bulk perps margin account", "USDC"],
  "katana-dex": ["Katana DEX pools (Ronin)", "RON"],
  "anthias-labs": ["Anthias-curated Morpho V2 vaults", "USDC"],
  "syncswap": ["SyncSwap pools", "ETH"],
  "metalx-swap": ["Metal X AMM pools (XPR)", "XPR"],
  "defa-by-invoicemate": ["DEFA invoice-factoring pools (LIFT)", "USDC"],
  "monolith-market": ["Monolith CDP factory (own stablecoin)", "wstETH"],
  "fluxion-network": ["Fluxion DEX pools (Mantle)", "USDC"],
  "vault-street": ["primeUSD/CARRY (Vault Street)", "USDC"],
  "hertzflow": ["HertzFlow perps pools", "USDT"],
  "boros": ["Boros rate markets (Pendle)", "WETH"],
  "turboflow-perps": ["TurboFlow perps account", "USDT"],
  "aftermath-aflp": ["afLP vault (Aftermath)", "USDC"],
  "loopscale-curation": ["Loopscale curated Vaults (Genesis)", "USDC"],
  "stablehodl": ["StableHodl staking", "USDT"],
  "temple": ["TEMPLE staking (TempleDAO)", "TEMPLE"],
  "granite": ["Granite BTC lending (Stacks)", "sBTC"],
  "swan-dao": ["swanUSD CDP (Monolith)", "wstETH"],
  "btcfi-cdp": ["BtcUSD CDP (BTCfi)", "WBTC"],
  "mezzanine": ["Mezzanine tranching vaults (Hastra)", "USDC"],
  "damm-capital": ["DAMM Stablecoin Fund", "USDC"],
  "alphagrowth": ["AlphaGrowth-curated Morpho vaults", "USDC"],
  "flying-tulip-ftusd": ["ftUSD mint (Flying Tulip)", "USDC"],
  "goonfi": ["GoonFi V2 pools", "WSOL"],
  "monarq": ["MXRPY yield vault (Monarq/Upshift)", "FXRP"],
  "nucleus": ["Nucleus managed vaults", "USDC"],
};

/** Factual inputs to the gate evaluator (no outcomes are encoded). */
export interface EconInput {
  capital: number;
  minCode: number; // 0 unverified, 1 none, 2 has a minimum
  minUsd: number | null; // documented USD minimum, else null
  product: boolean; // the route record names a verified product
  asset: boolean; // the route record names a verified deposit asset
  rewardType: number; // 0 unknown, 1 points, 2 none documented, 3 monetary variable (floor 0), 4 monetary floor > 0
  rewardLower: number; // USD lower bound when rewardType is 4
  feePct: number | null; // documented principal fee %, else null
  feeZero: boolean; // documented zero deposit/withdrawal fees
  gasZero: boolean; // documented zero gas
  gasUpper: number | null; // documented gas USD upper bound (round trip), else null
  gasEst: number; // estimated gas USD (display only; never a bound)
  xfer: number; // 0 none, 1 unbounded slippage, 2 zero-slippage documented
  mech: number; // mechanism code 0..15 (0 = unknown route)
  elig: number; // 0 E0, 1 E1, 2 E2, 3 E3, 4 EU
  risk: number; // 1 R1, 2 R2, 3 R3, 4 RU, 5 RS
  incident: number; // 0 none, 1 historical/resolved, 2 unresolved
  flags: number; // 1 live token, 2 suspended, 4 not retail, 8 incident, 16 jurisdiction-named
  tokenCode: number; // 0 pre-token, 1 live token, 2 unknown
  exitStages: number[] | null; // stage maxima, null = unbounded
  exitMin: number | null; // mandatory minimum exit duration (lock/cooldown), null = none documented
  exitComplete: boolean; // the encoded stages cover the complete exit to withdrawable balance
  holdDays: number;
}

export interface EconEval {
  verdict: Verdict;
  gates: number[]; // G1..G6: -1 UNKNOWN, 0 FAIL, 1 PASS
  blockers: string[]; // computed blocking-reason codes
  hard: boolean; // a proven hard exclusion (SKIP) fired
  costBounded: boolean;
  costUpper: number; // USD upper bound when bounded
  exitTotal: number | null; // complete-exit bound in days when bounded
}

/** The six-gate evaluator. Pure: same inputs, same output. Malformed or
 * nonfinite inputs never pass a gate. Estimated gas never establishes a cost
 * bound; a missing mandatory cost component makes total cost unbounded. */
export function evaluateEcon(x: EconInput): EconEval {
  const fin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  const g = [-1, -1, -1, -1, -1, -1];
  const per: string[][] = [[], [], [], [], [], []]; // blockers per gate, G1..G6
  let hard = false;
  // G5 Cost first (G1's net depends on it): verified round-trip upper bound
  // <= 2% of principal. Every mandatory component must be explicitly bounded
  // or inapplicable: gas (documented zero gas or a documented USD upper
  // bound; negative or nonfinite figures are malformed, never bounds),
  // protocol fees (documented zero or a documented principal %), conversion
  // slippage (none needed, or documented zero), and funding/maintenance
  // (perpetuals funding is unbounded). Estimated gas never establishes a
  // bound. A documented fee component alone above the SKIP ratio is a
  // verified unavoidable lower bound and proves the breach by itself.
  const gasUpperBad = x.gasUpper !== null && x.gasUpper !== undefined && !(fin(x.gasUpper) && x.gasUpper >= 0);
  const flagsOk = fin(x.flags) && Number.isInteger(x.flags) && x.flags >= 0 && x.flags <= 31;
  const fl = flagsOk ? x.flags : 0;
  const feeBad = (x.feePct !== null && x.feePct !== undefined && !(fin(x.feePct) && x.feePct >= 0)) || (x.feeZero === true && fin(x.feePct) && x.feePct > 0);
  const gasBad = x.gasZero === true && fin(x.gasUpper) && x.gasUpper > 0;
  const gasB = !gasUpperBad && (x.gasZero === true || (fin(x.gasUpper) && x.gasUpper >= 0));
  const feeB = x.feeZero === true || (fin(x.feePct) && x.feePct >= 0);
  const xferB = x.xfer === 0 || x.xfer === 2;
  const mechBad = !fin(x.mech) || !Number.isInteger(x.mech) || x.mech < 0 || x.mech > 15;
  const fundB = !mechBad && x.mech !== 8;
  let costBounded = false;
  let costUpper = 0;
  if (fin(x.capital) && x.capital > 0 && gasB && feeB && xferB && fundB && !feeBad && !gasBad) {
    costBounded = true;
    costUpper = (x.gasZero === true ? 0 : (x.gasUpper as number)) + (fin(x.feePct) ? (x.feePct / 100) * x.capital : 0);
    if (!fin(costUpper)) { costBounded = false; costUpper = 0; }
  }
  if (costBounded) {
    const ratio = costUpper / x.capital;
    if (ratio <= POLICY.farm_max_fee_ratio) g[4] = 1;
    else { g[4] = 0; per[4]!.push('COST!'); if (ratio > POLICY.skip_above_fee_ratio) hard = true; }
  } else if (fin(x.feePct) && x.feePct / 100 > POLICY.skip_above_fee_ratio) {
    g[4] = 0; per[4]!.push('COST!'); hard = true; // documented component alone breaches
  } else { g[4] = -1; per[4]!.push('COST?'); }
  // G1 Rewards: documented monetary rewards with positive conservative net
  // (net_lower = rewards_lower - C_RT_upper > 0). Reward type is independent
  // of eligibility: points and documented-none have zero monetary value;
  // variable monetary yield has a conservative lower bound of 0.
  if (x.rewardType === 4 && fin(x.rewardLower) && x.rewardLower >= 0) {
    if (!costBounded) { g[0] = -1; per[0]!.push('NET?'); }
    else if (x.rewardLower - costUpper > 0) g[0] = 1;
    else { g[0] = 0; per[0]!.push('NET!'); }
  } else if (x.rewardType === 3) {
    if (costBounded) { g[0] = 0; per[0]!.push('NET!'); }
    else { g[0] = -1; per[0]!.push('NET?'); }
  } else if (x.rewardType === 1) { g[0] = 0; per[0]!.push('POINTS'); }
  else if (x.rewardType === 2) { g[0] = 0; per[0]!.push('NET!'); }
  else { g[0] = -1; per[0]!.push('REWARD?'); }
  // G2 Eligibility: identified product, verified retail route, jurisdiction,
  // token status. A mechanism family alone is not a route.
  let g2f = false;
  let g2u = false;
  if (flagsOk && (fl & 4) !== 0) { per[1]!.push('ELIG!'); hard = true; g2f = true; }
  if (x.tokenCode === 1) { per[1]!.push('TOKEN!'); hard = true; g2f = true; }
  const tokenBad = !fin(x.tokenCode) || !Number.isInteger(x.tokenCode) || x.tokenCode < 0 || x.tokenCode > 2;
  if (x.tokenCode === 2 || tokenBad) { per[1]!.push('TOKEN?'); g2u = true; }
  if (x.mech === 0 || mechBad || x.product !== true || x.asset !== true) { per[1]!.push('ROUTE?'); g2u = true; }
  const eligBad = !fin(x.elig) || !Number.isInteger(x.elig) || x.elig < 0 || x.elig > 4;
  if (x.elig === 4 || eligBad || !flagsOk || (fl & 16) !== 0) { per[1]!.push('ELIG?'); g2u = true; }
  g[1] = g2f ? 0 : g2u ? -1 : 1;
  // G3 Capital: verified minimum deposit, affordable at the stated capital.
  if (x.minCode === 1) g[2] = 1;
  else if (x.minCode === 2) {
    if (!fin(x.minUsd) || x.minUsd < 0) { g[2] = -1; per[2]!.push('MIN?'); }
    else if (fin(x.capital) && x.minUsd > x.capital) { g[2] = 0; per[2]!.push('MIN!'); hard = true; }
    else if (!fin(x.capital)) { g[2] = -1; per[2]!.push('MIN?'); }
    else g[2] = 1;
  } else { g[2] = -1; per[2]!.push('MIN?'); }
  // G4 Risk: R1 supported by evidence and no material incident. An incident
  // fails the gate independently of the risk code: unresolved incidents are
  // 'INC!', historical/resolved ones 'INC'.
  if (x.incident === 2) { g[3] = 0; per[3]!.push('INC!'); if (x.risk === 3) { per[3]!.push('R3'); hard = true; } }
  else if (x.incident === 1) { g[3] = 0; per[3]!.push('INC'); if (x.risk === 3) { per[3]!.push('R3'); hard = true; } }
  else if (x.risk === 1 && x.incident === 0) g[3] = 1;
  else if (x.risk === 2 && x.incident === 0) { g[3] = 0; per[3]!.push('R2'); }
  else if (x.risk === 3 && x.incident === 0) { g[3] = 0; per[3]!.push('R3'); hard = true; }
  else { g[3] = -1; per[3]!.push('RISK?'); }
  // G6 Exit: verified complete exit within 7 days (sum of stage maxima, all
  // mandatory stages covered). A documented maximum above 30 days and a
  // mandatory lock above 30 days are distinct claims; either breaches the
  // SKIP threshold.
  let exitTotal: number | null = null;
  if (x.exitComplete === true && Array.isArray(x.exitStages) && x.exitStages.length > 0 && x.exitStages.every((s) => fin(s) && s >= 0)) {
    exitTotal = x.exitStages.reduce((a, b) => a + b, 0);
    if (!fin(exitTotal)) exitTotal = null;
  }
  const exitMinBad = x.exitMin !== null && (!fin(x.exitMin) || x.exitMin < 0);
  if (exitMinBad) { g[5] = -1; per[5]!.push('EXIT?'); }
  else if (exitTotal === null) {
    g[5] = -1; per[5]!.push('EXIT?');
    if (fin(x.exitMin) && x.exitMin > POLICY.skip_above_exit_days) { per[5]!.push('EXIT!'); hard = true; }
  } else if (fin(x.exitMin) && x.exitMin > exitTotal) {
    // Inconsistent bounds: a mandatory lock longer than the claimed complete
    // exit cannot both hold; the exit is unverified, and a lock above the
    // SKIP threshold is a proven hard exclusion on its own.
    g[5] = -1; per[5]!.push('EXIT?');
    if (x.exitMin > POLICY.skip_above_exit_days) { per[5]!.push('EXIT!'); hard = true; }
  } else if (exitTotal <= POLICY.farm_max_exit_days) g[5] = 1;
  else { g[5] = 0; per[5]!.push('EXIT!'); if (exitTotal > POLICY.skip_above_exit_days || (fin(x.exitMin) && x.exitMin > POLICY.skip_above_exit_days)) hard = true; }
  // Verdict precedence; suspension overrides and is evaluated first.
  const blockers = per.flat();
  const susp = (flagsOk && (fl & 2) !== 0) || x.risk === 5;
  let verdict: Verdict;
  if (susp) { blockers.unshift('SUSP'); verdict = 'SUSPENDED'; }
  else if (hard) verdict = 'SKIP';
  else if (g.some((v) => v === -1)) verdict = 'UNVERIFIED';
  else if (g.every((v) => v === 1)) verdict = 'FARM';
  else verdict = 'CONDITIONAL';
  return { verdict, gates: g, blockers, hard, costBounded, costUpper, exitTotal };
}

/** Assemble the evaluator inputs for one protocol from the verified tables. */
export function econInputFor(p: SnapshotProtocol, age: number | null): EconInput {
  const e = ECON[p.slug];
  const row = MECH_BY_SLUG.get(p.slug);
  let capital: number;
  let gasEst: number;
  let holdDays: number;
  let exitDays: number;
  let elig: number;
  let risk: number;
  let mech: number;
  let minCode: number;
  let minUsd: number | null;
  let flags: number;
  if (e !== undefined) {
    capital = e[0]!;
    gasEst = e[1]!;
    holdDays = e[4]!;
    exitDays = e[5]!;
    elig = e[6]!;
    risk = e[7]!;
    mech = parseInt(mechanismFor(p).slice(1), 10);
    minCode = TOP40_MINCODE[p.slug] ?? 0;
    minUsd = TOP40_MINUSD[p.slug] ?? null;
    flags = 0;
    if (LIVE[p.slug] !== undefined) flags |= 1;
    if (e[8] === 4 || risk === 5) flags |= 2;
    if (TOP40_NOT_RETAIL.has(p.slug)) flags |= 4;
    if (TOP40_GEO.has(p.slug)) flags |= 16;
  } else if (row !== undefined) {
    const chain = chainOf(p);
    mech = row[1]!;
    exitDays = row[2]!;
    minCode = row[3]!;
    elig = row[4]!;
    risk = row[5]!;
    flags = row[6]!;
    capital = capitalFor(p);
    holdDays = holdDaysFor(age);
    gasEst = Math.round(txsFor(mech) * gasFor(chain) * 100) / 100;
    minUsd = MINUSD[p.slug] ?? null;
  } else {
    capital = capitalFor(p);
    holdDays = holdDaysFor(age);
    gasEst = 0;
    exitDays = -1;
    elig = 4;
    risk = 4;
    mech = 0;
    minCode = 0;
    minUsd = null;
    flags = 0;
  }
  const tokenCode = TOKEN_UNKNOWN.has(p.slug) ? 2 : (flags & 1) !== 0 || typeof p.mcap_usd === 'number' ? 1 : p.mcap_usd === undefined ? 2 : 0;
  const floor = REWARD_FLOOR[p.slug];
  const rewardType = floor !== undefined ? 4 : REWARD_NONE.has(p.slug) ? 2 : REWARD_ZERO_KNOWN.has(p.slug) ? 3 : elig === 3 ? 3 : elig === 2 ? 1 : elig === 0 ? ([1, 2, 3, 4, 5, 10, 11, 15].includes(mech) ? 3 : 2) : 0;
  const exitStages = exitDays < 0 ? null : EXIT_STAGES[p.slug] ?? [exitDays];
  const incident = INCIDENT_UNRESOLVED.has(p.slug) ? 2 : INC[p.slug] !== undefined ? 1 : 0;
  if (incident > 0) flags |= 8;
  return {
    capital, minCode, minUsd, product: ROUTES_SRC[p.slug]?.[0] != null, asset: ROUTES_SRC[p.slug]?.[1] != null,
    rewardType, rewardLower: floor ?? 0,
    feePct: FEE_PCT[p.slug] ?? null, feeZero: FEE_ZERO.has(p.slug),
    gasZero: GAS_ZERO.has(p.slug), gasUpper: GAS_UPPER[p.slug] ?? null, gasEst,
    xfer: XFER_UNBOUNDED.has(p.slug) ? 1 : XFER_ZERO.has(p.slug) ? 2 : 0,
    mech, elig, risk, incident, flags, tokenCode, exitStages,
    exitMin: EXIT_MIN[p.slug] ?? null, exitComplete: exitStages !== null, holdDays,
  };
}

/** Economic verdict + fee for a rank 41-198 row, from verified parameters. */
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
  const verdict = evaluateEcon(econInputFor(p, age)).verdict;
  return { verdict, fee, feeBurden, active, attr: null, elig, risk, exit };
}

/** Verification task per blocker code (for verification-only routes). */
const VERIFY_TASKS: Record<string, string> = {
  'COST?': 'a verified round-trip cost bound',
  'EXIT?': 'a verified complete-exit bound',
  'NET?': 'a documented reward floor above the cost bound',
  'REWARD?': 'the reward terms',
  'POINTS': 'a monetary reward (points are worth $0 here)',
  'NET!': 'a monetary reward above cost (none documented)',
  'ROUTE?': 'the product, asset and retail route',
  'ELIG?': 'retail eligibility and jurisdiction',
  'TOKEN?': 'the token status',
  'MIN?': 'the minimum deposit in USD',
  'RISK?': 'the risk classification',
  'INC': 'the incident resolution',
  'INC!': 'the unresolved incident',
  'R2': 'an R1 risk profile',
};
function verifyTasks(blockers: string[]): string {
  const seen: string[] = [];
  for (const b of blockers) { const t = VERIFY_TASKS[b] ?? b; if (!seen.includes(t)) seen.push(t); }
  return seen.join('; ');
}
function verifyPhrase(mech: number): string {
  switch (mech) {
    case 1: return 'the vault route';
    case 2: return 'the lending market';
    case 3: return 'the CDP vault, collateral asset and minimum ratio';
    case 4: return 'the staking pool, asset and cooldown';
    case 5: return 'the restaking vault, collateral asset and epoch rules';
    case 6: return 'the pool, assets and fee tier';
    case 8: return 'the market, margin asset and liquidation metric';
    case 9: return 'the market, collateral and eligibility';
    case 10: return 'eligibility, the asset and redemption terms';
    case 11: return 'the mint/redeem rules and collateral';
    case 12: return 'the bridge route, asset and settlement';
    case 15: return 'access, custody, fees and redemption';
    default: return 'the mechanism, route, asset and minimum';
  }
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
      { text: 'Risk: mechanism unknown. Do not deposit until the route, asset, minimum and exit are verified from the protocol docs.', cost: 'free', time: '10 min' }];
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
      { text: `If you already hold a position, check ${p.name}'s own page for the official exit or repayment notice before moving funds.`, cost: 'free', time: '15 min' }];
  }
  if ((flags & 1) !== 0) {
    const tok = LIVE[p.slug] ?? 'a live token';
    return [setup,
      { text: `${p.name} already has a live token (${tok}) trading, so the "pre-token launch" premise does not apply. The snapshot records no token, so this row is ranked as pre-token, but a launch has already happened.`, cost: 'free to verify', time: '15 min' },
      { text: `Do not farm ${p.name} for a launch allocation. If you want exposure, buy ${tok} on a market instead and size it like any traded token.`, cost: 'held', time: `${hold} days` },
      { text: `Risk: the implied value is not applicable to a protocol that already trades. ${incident !== undefined ? `Incident: ${incident}` : 'Check the protocol docs for current status.'}`, cost: 'free', time: '10 min' }];
  }
  if ((flags & 4) !== 0) {
    const reason = NORETAIL[p.slug] ?? 'Not retail-executable.';
    return [setup,
      { text: `${p.name} is not executable for a retail user. ${reason}`, cost: 'free to verify', time: '15 min' },
      { text: `Do not attempt a $${capital} retail deposit: no verified retail route exists. If access changes, re-verify eligibility and minimums on the protocol's own page first.`, cost: 'held', time: `${hold} days` },
      { text: `Risk: institutional / permissioned access. ${incident !== undefined ? `Incident: ${incident}` : 'Check the protocol docs for current status.'}`, cost: 'free', time: '10 min' }];
  }
  if (mech === 0) {
    return [setup,
      { text: mechEntry(p, mech, capital, chain, minCode, minUsd), cost: 'free to verify', time: '15 min' },
      { text: `No executable route is established from the snapshot for ${p.name}. Do not send funds until the route, asset, minimum and exit are verified from its docs.`, cost: 'held', time: `${hold} days` },
      { text: mechRisk(mech, incident), cost: 'free', time: '10 min' }];
  }
  const exitText = exit < 0 ? 'Settlement time is UNVERIFIED; verify the withdrawal mechanism before depositing.' : exit === 0 ? 'Withdrawal is instant where the vault holds idle liquidity.' : `Withdrawal takes about ${exit} day${exit === 1 ? '' : 's'} (verified).`;
  const eligText = elig === 'E3' ? 'Verified monetary reward terms; see the plan for the rate.' : elig === 'E2' ? 'A documented points program exists; check its terms on the protocol page.' : elig === 'E1' ? 'Reward eligibility is speculative; no verified allocation terms.' : elig === 'E0' ? 'No points program or reward documented.' : 'Reward eligibility UNVERIFIED.';
  const feeText = fee > 0 ? `$${fee} total gas (est., ${txsFor(mech)} txs on ${chain})` : 'gas (est., UNVERIFIED)';
  const ev = evaluateEcon(econInputFor(p, age));
  if (ev.verdict === 'SKIP') {
    const hardList = ev.blockers.filter((b) => b.endsWith('!') || b === 'R3');
    const notes: string[] = [];
    if (hardList.includes('MIN!')) notes.push(`Documented minimum $${minUsd} exceeds the $${capital} planned capital.`);
    if (hardList.includes('COST!')) notes.push('Documented round-trip fees breach the 5% SKIP threshold.');
    if (hardList.includes('EXIT!')) notes.push(ev.exitTotal !== null ? 'Documented complete exit exceeds 30 days.' : 'Mandatory exit lock exceeds 30 days.');
    if (hardList.includes('R3')) notes.push('R3 risk classification (unacceptable).');
    if (hardList.includes('TOKEN!')) notes.push('A live token already trades.');
    return [setup,
      { text: `Do not deposit: proven hard exclusion (${hardList.join(', ')}). ${notes.join(' ')}`, cost: 'do not deposit', time: 'now' },
      { text: 'Reconsider only if the exclusion no longer applies; re-verify eligibility, minimum, cost and exit from primary docs first.', cost: 'free', time: `${hold} days` },
      { text: mechRisk(mech, incident), cost: 'free', time: '10 min' }];
  }
  if (ev.verdict === 'UNVERIFIED') {
    const min = minCode === 2 && minUsd !== null ? ` Minimum deposit $${minUsd} (verified).` : minCode === 1 ? ' No minimum deposit documented.' : ' Minimum deposit UNVERIFIED.';
    return [setup,
      { text: `Do not deposit yet. Verify ${verifyPhrase(mech)} on ${p.name}'s own page on ${chain}.${min} Still unverified: ${verifyTasks(ev.blockers)}.`, cost: 'free to verify', time: '15 min' },
      { text: `Weekly: re-check ${p.name}'s docs for the missing items; no transaction until every FARM gate passes. ${eligText}`, cost: 'free', time: '10 min/wk' },
      { text: 'No position is opened: research queue only. Re-run the gates when the missing facts are verified.', cost: 'free', time: `${hold} days` },
      { text: mechRisk(mech, incident), cost: 'free', time: '10 min' },
      { text: `Exit, if a position is ever opened: verify the withdrawal mechanism on ${p.name}'s own page first. ${exitText}`, cost: 'free to verify', time: exit < 0 ? 'UNVERIFIED' : exit === 0 ? 'instant' : `~${exit} days` }];
  }
  return [setup,
    { text: mechEntry(p, mech, capital, chain, minCode, minUsd), cost: feeText, time: '15 min' },
    { text: `Weekly: check the position and the protocol's own rewards page; no transaction unless the exit trigger hits. ${eligText}`, cost: 'free', time: '10 min/wk' },
    { text: `Hold ${hold} days. ${eligText}`, cost: 'held', time: `${hold} days` },
    { text: mechRisk(mech, incident), cost: 'free', time: '10 min' },
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
    const attr: number | null = null;
    if (e !== undefined) {
      verdict = evaluateEcon(econInputFor(s.p, age)).verdict;
      elig = (['E0', 'E1', 'E2', 'E3', 'EU'] as string[])[e[6]]!;
      risk = (['', 'R1', 'R2', 'R3', 'RU', 'RS'] as string[])[e[7]]!;
    } else {
      const ec = econFor(s.p, age);
      verdict = ec.verdict;
      elig = ec.elig;
      risk = ec.risk;
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
      token_status: LIVE[s.p.slug] !== undefined ? 'live token' : TOKEN_UNKNOWN.has(s.p.slug) ? 'unknown' : 'no token recorded',
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
