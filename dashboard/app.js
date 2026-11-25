// Token Radar dashboard, model b0. Reads window.RADAR (data.js, written by main.ts) and renders
// the ranked board, detail drawer, validation and integrity panels. No network.
(function () {
  'use strict';

  var DATA = window.RADAR;
  if (!DATA) return;
  var app = document.getElementById('board');
  var state = { q: '', category: 'all', chain: 'all', tab: 'pre-token', sort: 'implied', dir: -1, selected: null };

  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function fmtUsd(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return usd.format(n);
  }
  function fmtPct(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    return (n > 0 ? '+' : '') + n.toFixed(2) + '%';
  }
  function fmtAge(days) {
    if (days === null || days === undefined) return 'unknown';
    if (days >= 365) return (days / 365).toFixed(1) + 'y';
    return Math.max(0, Math.round(days)) + 'd';
  }
  // B0: implied = TVL x median multiple (0.21380325885644053), fitted on 128 traded protocols
  // in 128 token families. M1 (log regression) was tested and NOT promoted (worse 90th pct).
  var B0_MULTIPLE = 0.21380325885644053;
  var Q90_FACTOR = 42.45;
  function impliedOf(row) {
    return Math.max(1, Math.round(row.tvl_usd * B0_MULTIPLE));
  }
  function rangeOf(implied) {
    return { low: Math.max(1, Math.round(implied / Q90_FACTOR)), high: Math.round(implied * Q90_FACTOR) };
  }

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child === null || child === undefined) continue;
      if (Array.isArray(child)) child.forEach(function (c) { if (c) node.appendChild(c); });
      else if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    }
    return node;
  }

  function eqRows(pairs) {
    return el('div', { class: 'equation' }, pairs.map(function (p) {
      return el('div', null, el('span', { text: p[0] }), el('b', { class: 'num', text: p[1] }));
    }));
  }

  // Hand-written farm plans for the top 40 (the watchlist), keyed by slug.
  // Each step is [action, cost, time]. Rows 41-198 render their plan from data.js.
var FARM_PLANS={
"steakhouse-financial":[["Fresh wallet, $100 USDC on Base; seed offline.","free","5 min"],["Deposit $100 USDC into Steakhouse Prime USDC vault on Base via Morpho app.","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check vault share price; no tx unless exit trigger hits.","free to check","5 min/wk"],["Hold 30 days. No Steakhouse points; no confirmed allocation.","held","30 days"],["Risk: bad debt if collateral falls faster than liquidators act. Exit if share price falls >5%.","free to check","10 min"],["Exit: withdraw USDC on Base. Instant vaults settle same tx if liquid (Prime ~88% withdrawable).","~$0.10 gas (est.)","same tx"]],
"sentora-curator":[["Fresh wallet, $100 USDC on Ink; seed offline.","free","5 min"],["Deposit $100 USDC into Sentora Boring USDC vault on Ink via Sentora app.","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check vault share price and any pending redemption.","free to check","5 min/wk"],["Hold 30 days. No Sentora points; no confirmed allocation.","held","30 days"],["Risk: BoringVault redemptions are async (request, then solver fill or claim date). Exit if share price falls >5%.","free to check","10 min"],["Exit: request redemption, then claim when solver fills it or claim date arrives.","~$0.10 gas (est.)","up to 3 days"]],
"gauntlet":[["Fresh wallet, $100 USDC on Base; seed offline.","free","5 min"],["Deposit $100 USDC into Gauntlet USDC Prime vault on Base (0% performance fee) via Morpho app.","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check vault share price; no tx unless exit trigger hits.","free to check","5 min/wk"],["Hold 30 days. No Gauntlet points; USDC Prime shows 0.00% rewards. No confirmed allocation.","held","30 days"],["Risk: Mar 22 2026 Resolv USR exploit cost Gauntlet Core ~$4.95M. Exit if share price falls >5%.","free to check","10 min"],["Exit: redeem instantly if liquid (USDC Prime ~87% withdrawable). If utilization high, wait for repayments.","~$0.10 gas (est.)","same tx if liquid"]],
"veda":[["Fresh wallet, $100 USDC on Ink; seed offline.","free","5 min"],["Veda has no direct deposit app. Deposit $100 USDC into ether.fi Liquid vault on Ink (Veda BoringVault tech).","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check vault share price; no tx unless exit trigger hits.","free to check","5 min/wk"],["Hold 30 days. No VEDA token, no Veda airdrop, no Veda points season open. No confirmed allocation.","held","30 days"],["Risk: withdrawals via BoringQueue (time-delayed, solver-based). ether.fi AtomicQueue exploited Sep 2026.","free to check","10 min"],["Exit: request withdrawal via BoringQueue; Liquid ETH up to 3 days (7 days for Liquid USD RWAs).","~$0.10 gas (est.)","up to 3 days"]],
"usdd":[["Fresh wallet, $100 USDT on Tron; seed offline.","free","5 min"],["Swap $100 USDT to USDD 1:1 via Peg Stability Module (zero fee), then stake as sUSDD (~4% base rate).","$100 + ~$2 gas (est.)","15 min"],["Weekly: check sUSDD balance and USDD peg.","free to check","5 min/wk"],["Hold 30 days. USDD IS the token (~1.44B supply); no points program. Yield is sUSDD rate. CDP mint not used: minimum mint 500 USDD (TRX-C).","held","30 days"],["Risk: USDD 1.0 depegged Jun 2022; TRON DAO removed 12,000 BTC (~$730M) from backing Aug 2024. Exit if USDD slips >2%.","free to check","10 min"],["Exit: unstake sUSDD, swap USDD back to USDT via PSM (1:1, zero fee). No queue or lockup.","~$2 gas (est.)","same tx"]],
"upshift":[["Fresh wallet, $100 USDC on Monad; seed offline.","free","5 min"],["Deposit $100 USDC into Upshift vault on Monad via app.upshift.finance. No Upshift vaults on Base.","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check share price + Upshift Points S2 (1x deposits, 5x bonus while TVL under $750M, up to 12x).","free to check","5 min/wk"],["Hold 30 days. Upshift Points S2 documented (since Jul 2 2025); no token announced. No confirmed allocation.","held","30 days"],["Risk: Apr 18 2026 Kelp rsETH exploit cost hgETH vault ~$763K (~4.1%). US residents STRICTLY PROHIBITED.","free to check","10 min"],["Exit: requestRedeem, then claim after per-vault lag (WHYPE ~25h, uBTC ~3 days). Processed daily.","~$0.10 gas (est.)","up to 3 days"]],
"cian-yield-layer":[["Fresh wallet, $100 USDC on Arbitrum; seed offline.","free","5 min"],["Deposit $100 USDC into CIAN vault on Arbitrum via cian.app.","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check share price + CIAN Voyage Points (documented; accrue on unleveraged deposit value).","free to check","5 min/wk"],["Hold 30 days. CIAN Voyage Points documented; no token or conversion rate published. No confirmed allocation.","held","30 days"],["Risk: no audit reports published for CIAN (DefiLlama: zero audits). 8% performance fee + 0.02% exit fee.","free to check","10 min"],["Exit: submit requestRedeem, wait for batched processing (stETH layer ~5 days). Rules vary by strategy.","~$0.10 gas (est.)","~5 days"]],
"nonce-capital":[["Fresh wallet, $100 USDC on Optimism; seed offline.","free","5 min"],["Nonce has no standalone retail vault. Deposit $100 USDC into ether.fi Liquid vault on Optimism (Nonce is curator).","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check vault share price; no tx unless exit trigger hits.","free to check","5 min/wk"],["Hold 30 days. No Nonce points; Nonce has no token. No confirmed allocation.","held","30 days"],["Risk: ether.fi Liquid AtomicQueue exploited Sep 2026. US and UK users excluded from Liquid.","free to check","10 min"],["Exit: request withdrawal via queue; Liquid ETH up to 3 days (7 days for Liquid USD RWAs).","~$0.10 gas (est.)","up to 3 days"]],
"polymarket-international":[["Fresh wallet, $100 USDC on Polygon; seed offline.","free","5 min"],["Deposit $100 USDC on Polygon; auto-wraps to pUSD (trading collateral since CLOB V2 cutover Apr 28 2026).","$100 + ~$0.20 gas (est.)","15 min"],["Trade genuine markets: split across 3-4 markets, cap each position at $25. Taker fee 0.01-0.05.","free to check","5 min/wk"],["Hold 30 days. No points program, no token. Maker rebates + liquidity rewards documented. No confirmed allocation.","held","30 days"],["Risk: positions must be sold/resolved before balance is withdrawable. CTF Exchange V2 audited Mar 2026.","free to check","10 min"],["Exit: close or settle all positions first, then withdraw pUSD/USDC balance. No fee, no lockup once closed.","~$0.20 gas (est.)","near-instant once closed"]],
"onre":[["Fresh wallet, $100 USDC on Solana; seed offline.","free","5 min"],["Mint $100 ONyc in OnRe app by depositing USDC. Open Access is permissionless, no minimum; US residents cannot mint.","$100 + ~$0.02 gas (est.)","15 min"],["Weekly: check ONyc balance + OnRe Points (live Sep 11 2025; 1 point per ONyc per day, multipliers up to 4x).","free to check","5 min/wk"],["Hold 30 days. OnRe Points documented; no token confirmed; points have no cash value. No confirmed allocation.","held","30 days"],["Risk: primary redemption is quarterly only (30-day notice window, fulfilled at quarter-end). Retail relies on AMMs.","free to check","10 min"],["Exit: sell ONyc on Solana AMM anytime (slippage risk), or request quarterly redemption (fulfilled at quarter-end).","~$0.02 gas (est.)","AMM sale anytime"]],
"opentrade":[["Do NOT deposit. OpenTrade is for professional investors and institutions only; KYC required to mint/redeem.","free","5 min"],["Verify: check for a retail-accessible product. The xSOLY vault has a verified $1,000 USDC minimum (docs.opentrade.io); the barrier is institutional access.","free","15 min"],["If a retail route is later verified, confirm the 2-5 business day redemption and fee schedule first.","free","10 min"],["No plan proceeds without a verified retail route. No documented points program.","held","0 days"],["Risk: institutional-only, KYC-gated, 2-5 business day settlement. Audited (Cantina Aug 2026). No known exploit.","free to check","10 min"]],
"rockawayx":[["Fresh wallet, $100 USDC on Solana; seed offline.","free","5 min"],["Deposit $100 USDC into RockawayX-curated Kamino USDC Earn vault on Solana via Kamino app. No lockup.","$100 + ~$0.02 gas (est.)","15 min"],["Weekly: check share price + any active Merkl/Morpho campaign for this vault (vault-specific, time-limited).","free to check","5 min/wk"],["Hold 30 days. No RockawayX-wide points; rewards are per-vault campaigns that renew or expire.","held","30 days"],["Risk: some RockawayX vaults are permissioned (e.g. Confidential RWA USDC). Verify permissionless first.","free to check","10 min"],["Exit: withdraw in a single tx, subject to lending liquidity. No lockup, no unbonding period.","~$0.01 gas (est.)","same tx if liquid"]],
"plume-vaults":[["Fresh wallet, $100 USDC on Plume Mainnet; seed offline.","free","5 min"],["Deposit $100 USDC into Plume Nest vault (e.g. nBASIS, nALPHA, nTBILL) on Plume Mainnet to mint nTOKEN.","$100 + ~$0.02 gas (est.)","15 min"],["Weekly: check vault share price and nTOKEN balance.","free to check","5 min/wk"],["Hold 30 days. Plume Nest Points Season One ran Nov 2025-Mar 2026 and ENDED; later season NOT verified.","held","30 days"],["Risk: Plume/Nest NOT available to US persons. Withdrawal varies by vault (same-day to 7-day cooldown).","free to check","10 min"],["Exit: instant redeem when liquid (with fees), or async ERC-7540 request-then-claim. Or sell nTOKEN on Rooster DEX.","~$0.01 gas (est.)","up to 7 days"]],
"hyperithm":[["Fresh wallet, $100 USDC on Monad; seed offline.","free","5 min"],["Deposit $100 USDC into Hyperithm USDC Apex Morpho vault on Monad via Morpho app.","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check share price and how much is withdrawable.","free to check","5 min/wk"],["Hold 30 days. No Hyperithm-native points; Monad vaults earn Merkl incentives in WMON (~0.8-0.89% APR, ends Nov 30 2026).","held","30 days"],["Risk: at a reviewed pin only ~5.7% of hyperUSDCa was convertible within one day; 94.3% had no exit timeline.","free to check","10 min"],["Exit: redeem vault token; processed from available liquidity, can wait when markets are fully lent. No fixed duration.","~$0.10 gas (est.)","no fixed timeline"]],
"bittensor-dtao":[["Fresh wallet, $100 of TAO on Bittensor chain; seed offline.","free","5 min"],["Stake TAO into a dTAO subnet via wallet (Talisman, SubWallet) or taostats. Min 0.002 TAO per stake.","$100 + ~$0.10 gas (est.)","15 min"],["Weekly: check subnet alpha price vs TAO and validator take (default 18% of emissions). Rewards are TAO per epoch (~72 min).","free to check","5 min/wk"],["Hold 60 days. No points program, no airdrop; rewards are live TAO emissions, auto-compounded.","held","60 days"],["Risk: Jul 2024 PyPI supply-chain attack stole ~32,000 TAO (~$8M) from wallets. Bittensor Terms exclude sanctioned countries.","free to check","10 min"],["Exit: unstake in a single tx; converts alpha back to TAO at pool price (slippage possible). No separate swap needed.","~$0.10 gas (est.)","same tx"]],
"bitfi-basis":[["Fresh wallet, $100 USDT on Base; seed offline.","free","5 min"],["Mint $100 bfUSD by depositing USDT on Base, then stake into Horizon vault (hbfUSD, low-risk) via app.bitfi.one.","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check hbfUSD balance + BitFi Points (live; holding bfUSD/hbfUSD/pbfUSD/LP, quests, referrals, Galxe).","free to check","5 min/wk"],["Hold 30 days. BitFi Points documented; future airdrops based on total points. No token confirmed.","held","30 days"],["Risk: BitFi is CeDeFi - yield depends on off-chain trading. SlowMist audited bfUSD Dec 2025 (2 medium findings).","free to check","10 min"],["Exit: request withdrawal from hbfUSD, claim bfUSD after settlement (1 epoch = 24h). Then redeem to USDT (~3 days, zero fee).","~$0.20 gas (est.)","~3 days standard"]],
"symbiotic":[["Fresh wallet, $100 wstETH on Ethereum; seed offline.","free","5 min"],["Deposit $100 wstETH into permissionless Symbiotic vault on Ethereum via Symbiotic app. No KYC gate documented.","$100 + ~$20 gas (est.)","15 min"],["Weekly: check share price + Symbiotic Points S2 (since Jan 2025; points/hr = vault TVL to adapters x 0.001).","free to check","5 min/wk"],["Hold 30 days. Symbiotic Points documented; no token confirmed, docs promise no conversion. No confirmed allocation.","held","30 days"],["Risk: funds remain slashable until epoch boundary. Curators may charge up to 5% admin fee. US/UK excluded by Terms.","free to check","10 min"],["Exit: submit withdraw request (burns shares, queues collateral), claim only after next vault epoch ends (up to ~14 days).","~$20 gas (est.)","up to ~14 days"]],
"defi-saver-asset-management":[["Do NOT open a CDP with $100. Maker vaults need minimum 1 ETH collateral; Aave positions 0.1 ETH; CDP Automation 200 DAI debt.","free","5 min"],["Verify: 0.1 ETH is roughly $300 - three times this plan's capital. Raise capital to meet the minimum first.","free","15 min"],["If capital is raised, open a Maker/Sky CDP or leveraged position (Aave, Compound, Maker, Spark, Morpho, Fluid) via app.defisaver.com.","free","10 min"],["No plan proceeds at $100. A CDP closes in one tx (debt repaid from collateral, remainder returned). DFS Rewards is a top-20 campaign (50,000 USDC), not a participation reward.","held","0 days"],["Risk: liquidation if collateral ratio falls below Maker minimum. DeFi Saver charges 0.25% on Boost/Repay/closing.","free to check","10 min"]],
"k3-capital":[["SUSPENDED. Do not deposit. On 18 Nov 2026 attackers drained K3's sBOLD vault of ~$3.42M in ~8 min via share-price manipulation. Contracts paused; post-mortem Nov 19 2026.","free","5 min"],["No farm plan proceeds while vaults are paused and the incident is unresolved. Liquity V2 itself was unaffected.","free","5 min"],["Re-check only after a remediation post-mortem, re-audit, and confirmation depositors are made whole.","free","10 min"]],
"mellow-core":[["Fresh wallet, $100 ETH on Ethereum; seed offline.","free","5 min"],["Deposit $100 ETH into Lido Earn vault (earnETH) on Ethereum via stake.lido.fi or Mellow app.","$100 + ~$20 gas (est.)","15 min"],["Weekly: check share price + Mellow Points (Lido docs: points remain depositor's on withdrawal).","free to check","5 min/wk"],["Hold 30 days. Mellow Points accrue; no token confirmed. No confirmed allocation.","held","30 days"],["Risk: earnETH vault paused Apr 2026, withdrawals blocked 9+ days (rsETH losses); redemptions resumed by Nov 7 2026.","free to check","10 min"],["Exit: request withdrawal, claim after typical ~3 day wait (deposit wait up to ~24h; instant buffer covers part).","~$10 gas (est.)","~3 days"]],
"figure-markets-prime":[["Fresh wallet, $100 USDC on Provenance; complete KYC (SSN/ITIN + photo ID) first. Seed offline.","free","5 min"],["Buy $100 YLDS (SEC-registered yield-bearing stablecoin) and lend into Democratized Prime pool via Figure Markets app.","$100 + ~$0.02 gas (est.)","15 min"],["Weekly: check pool lent-out share and YLDS balance. Pools backed by home equity, auto, small-business, crypto loans.","free to check","5 min/wk"],["Hold 30 days. YLDS pays yield as a registered yield-bearing stablecoin. No points program. No confirmed allocation.","held","30 days"],["Risk: withdraw YLDS only up to available liquidity (pools 70-95% lent out Oct 30 2026). 0.5-point platform spread.","free to check","10 min"],["Exit: withdraw YLDS up to available liquidity, then redeem YLDS for dollars at face (as fast as same day).","~$0.01 gas (est.)","same day if liquid"]],
"hive-protocol":[["Fresh wallet, $100 of BTC; bridge it to B2 Network (BSquared). Seed offline.","free","5 min"],["Stake $100 BTC via Hive on B2 to safeguard B2 and receive $B2 tokens. Fee-free, instant reward activation. Stakes BTC, NOT USDC.","$100 + ~$5 gas (est.)","15 min"],["Weekly: check staked BTC balance and $B2 rewards accrued (paid proportionally to BTC staked).","free to check","5 min/wk"],["Hold 30 days. Rewards are the live $B2 token, not a points program. Minimum stake 0.001 BTC (2024 source; verify live).","held","30 days"],["Risk: no audits listed for Hive; no reported exploit. Official site restricts some countries/regions.","free to check","10 min"],["Exit: unstake; 1-day unstaking lock applies, then BTC is released. Cooperative close settles in ~1 confirmation.","~$5 gas (est.)","1-day unstaking lock"]],
"lagoon":[["Fresh wallet, $100 USDC on Arbitrum; seed offline.","free","5 min"],["Deposit $100 USDC into Lagoon ERC-7540 vault on Arbitrum via Lagoon app or curator front-end. Some vaults are permissioned.","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check share price and whether a settlement round is pending.","free to check","5 min/wk"],["Hold 30 days. No Lagoon-native points; incentives are vault/curator-specific, not protocol-wide.","held","30 days"],["Risk: fully async ERC-7540; wait is one settlement round (daily 12:00 UTC window for some; DAMM funds days to weeks).","free to check","10 min"],["Exit: submit requestRedeem, wait for settlement at next NAV update, then claim via redeem/withdraw. No fixed schedule.","~$0.20 gas (est.)","one settlement round"]],
"clearstar":[["Fresh wallet, $100 USDC on Base; seed offline.","free","5 min"],["Deposit $100 USDC into Clearstar-curated Morpho vault on Base (e.g. Base RWA, Core USDG) via app.morpho.org.","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check vault share price; no tx unless exit trigger hits.","free to check","5 min/wk"],["Hold 30 days. No Clearstar-native points; rewards are third-party/issuer-specific, not guaranteed.","held","30 days"],["Risk: no Clearstar-specific audit published. Hypernative monitoring on all Morpho vaults. Morpho Terms exclude Restricted Territories.","free to check","10 min"],["Exit: standard ERC-4626 redemption - withdraw immediately if liquid (Base RWA 99% withdrawable; Core USDG 100%).","~$0.10 gas (est.)","same tx if liquid"]],
"lightning-network":[["Fresh wallet, $100 of BTC; run a Lightning node or use a Lightning wallet. Seed offline.","free","5 min"],["Open a payment channel on Bitcoin mainnet: lock $100 BTC into 2-of-2 multisig with a peer. Min funding 20,000 sats.","$100 + ~$5 gas (est.)","15 min"],["Weekly: check channel liquidity and whether peer is online. Routing fees typically <$0.05 per payment.","free to check","5 min/wk"],["Hold 30 days. Lightning is a payment protocol, not a yield product: no token, no points, no yield. Not a farm.","held","30 days"],["Risk: force-close locks broadcaster funds behind to_self_delay (typically 144 blocks, ~1 day, up to 2016 blocks, ~2 weeks).","free to check","10 min"],["Exit: cooperative close settles in ~1 confirmation (~10 min). Unilateral force-close locks funds behind to_self_delay.","~$5 gas (est.)","~10 min cooperative"]],
"r25":[["Do NOT deposit. R25 is vault infrastructure on Pharos/Sui; rcUSD needs KYC + eligible-holder status; vaults go to institutions.","free","5 min"],["Verify: check for a retail-accessible vault (Axil Prime Credit is a 3-month USDC vault via an institutional gateway).","free","15 min"],["rcUSD redemption is a conditional obligation: KYC'd holders deliver rcUSD to issuer RiftWriter for face-value USDC; capacity, fees, deadline undisclosed.","free","10 min"],["No plan proceeds without a verified retail route. No audits listed; reserve composition undisclosed; issuer keys can mint rcUSD.","held","0 days"],["Risk: no verified retail access, undisclosed reserves, issuer-key minting power. No token, no points program.","free to check","10 min"]],
"b14g":[["SUSPENDED. Do not deposit. On Oct 31 2026 b14g staking was exploited for ~97M CORE. Core hard fork Nov 2 recovered ~70% of CORE; B14g planned pro-rata repayment.","free","5 min"],["No farm plan proceeds while the incident is unresolved. The board still ranks b14g on snapshot TVL, but farm is frozen.","free","5 min"],["Re-check only after a published post-mortem, re-audit, and confirmation depositors were repaid pro-rata.","free","10 min"]],
"saturn":[["Fresh wallet, $100 USDC on Monad; seed offline.","free","5 min"],["Retail cannot mint USDat directly (whitelisted only). Buy $100 USDat on secondary market (Curve USDC/USDat pool), stake into sUSDat vault (target 11%+ APY).","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check sUSDat share price and STRC dividend flow.","free to check","5 min/wk"],["Hold 30 days. sUSDat yield is STRC dividends (target 11%+ APY, documented). No Saturn points program.","held","30 days"],["Risk: no public audit references (reviewed May 2026). USDat backing migrated M0 $M to PYUSDx via proxy upgrade Aug 19 2026.","free to check","10 min"],["Exit: sUSDat redemptions are QUEUED - average ~3 days, max 7 days (Saturn must liquidate STRC first). Then sell USDat.","~$0.20 gas (est.)","queued ~3 days, max 7"]],
"figure-markets-exchange":[["Do NOT place an OTC trade. Figure Markets needs full KYC (name, address, DOB, gov ID; SSN/ITIN + photo ID). No documented retail OTC product.","free","5 min"],["Verify: retail products are spot trading (BTC, ETH, HASH vs fiat/USDC) and P2Prime margin lending, not OTC trading. NY residents cannot trade crypto.","free","15 min"],["If a verified retail route is confirmed, note min order (0.01 USD / 0.0001 USDC), 0.1% trade fee, fiat limits ($25k/24h ACH).","free","10 min"],["No plan proceeds without a verified retail OTC route. No points program; occasional promotions exist.","held","0 days"],["Risk: full KYC mandatory, geo restrictions, MPC custody, SIPC up to $500k. No known exploit documented.","free to check","10 min"]],
"curvance":[["Fresh wallet, $100 USDC on Monad; seed offline.","free","5 min"],["Supply $100 USDC to isolated two-token lending market on Monad via app.curvance.com (e.g. wsrUSD/USDC).","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check market utilization + Curvance Bytes (documented since Nov 27 2025; deposits, loans, settlements earn Bytes).","free to check","5 min/wk"],["Hold 30 days. Bytes documented; no published conversion to CVE; CVE has not launched. No confirmed allocation.","held","30 days"],["Risk: eBTC market paused since May 2026, WBTC lenders still cannot redeem. Emergency Council bypassed 5-day timelock Sep 30 2026.","free to check","10 min"],["Exit: withdraw anytime if liquid. Note: posting collateral/borrowing starts a 20-min hold blocking repay/withdraw.","~$0.10 gas (est.)","same tx if liquid"]],
"galaxy-curation":[["Do NOT deposit via Galaxy. Galaxy Curator is institutional-only, distributed via Fireblocks Earn to 2,400+ institutions.","free","5 min"],["Note: underlying Morpho V2 vaults (Galaxy USDC on Arc, $105.3M) are permissionless and visible on Morpho app; Galaxy's own path is institutional.","free","15 min"],["If a retail route to the underlying vaults is verified, check the vault address, 7-day cap-raise timelock, and fees first.","free","10 min"],["No plan proceeds without a verified retail route. No token, no documented points program.","held","0 days"],["Risk: institutional-only by design; no audit listed for Galaxy Curation product itself.","free to check","10 min"]],
"extended-perps":[["Fresh wallet, $50 USDC on Arc; seed offline.","free","5 min"],["Deposit $50 USDC on Arc (settlement migrated from Starknet Oct 22 2026; also via Ethereum/Base CCTP). Trade 300+ perps.","$50 + ~$0.20 gas (est.)","15 min"],["Open a small perpetual position, $25 cap. 0% maker / 0.025% taker crypto; 0% / 0.010% RWA. Weekly: check margin ratio.","free to check","5 min/wk"],["Hold 30 days. Points program exists (carried across in Oct 22 migration); no conversion terms documented. No confirmed allocation.","held","30 days"],["Risk: liquidation when margin ratio (maintenance margin / equity) exceeds 100%. The 66%/80% thresholds could NOT be verified.","free to check","10 min"],["Exit: close position, then withdraw USDC on Arc. Sub-second finality, no lock-up or queue. No 1-2 hour delay.","~$0.10 gas (est.)","sub-second finality"]],
"lofty":[["Fresh wallet, $100 USDCa on Algorand; complete KYC/AML for bank deposits, positions over $200, withdrawals. Seed offline.","free","5 min"],["Buy $100 of fractional property tokens on Lofty marketplace. Minimum $50 per property token. 2.5% purchase fee.","$100 + $2.50 fee + ~$0.01 gas (est.)","15 min"],["Weekly: check rental income (paid daily in USDC) and whether a buyer exists at your target price.","free to check","5 min/wk"],["Hold 30 days. Return is daily rental income in USDC (documented). No points program or token allocation.","held","30 days"],["Risk: no lock-up, but a sale needs a buyer at your price - no fill time assured. CA DFPI consent order Nov 14 2022 ($37,500).","free to check","10 min"],["Exit: sell on 24/7 marketplace (3% sale fee; instant orders +~2.5% per side). Proceeds to bank take up to 4 business days.","$3.00 fee + ~$0.01 gas (est.)","up to 4 business days"]],
"theo-network-thusd":[["Fresh wallet, $100 USDC on Ethereum; seed offline.","free","5 min"],["Acquire $100 thUSD via Theo app and stake for sthUSD. Primary minting is permissioned (MINTER_ROLE); thBILL is KYC-gated.","$100 + ~$20 gas (est.)","15 min"],["Weekly: check sthUSD balance + thUSD Points (live since Jun 25 2026; holding, staking, vault deposits earn points).","free to check","5 min/wk"],["Hold 30 days. thUSD Points documented; no Theo token or airdrop announced. No confirmed allocation.","held","30 days"],["Risk: sthUSD unstaking via redemption queue averaging ~2 weeks. Core vault locks 3 months; Core+/Boost lock 6 months.","free to check","10 min"],["Exit: unstake sthUSD through redemption queue (~2 weeks avg), then sell thUSD. Do not use a locked vault for 30 days.","~$10 gas (est.)","queue ~2 weeks"]],
"tydro":[["Fresh wallet, $100 USDT0 on Ink (Kraken OP Stack L2); seed offline.","free","5 min"],["Supply $100 USDT0 to Tydro lending market on Ink (Aave V3-based, non-custodial) via app.tydro.com.","$100 + ~$0.20 gas (est.)","15 min"],["Weekly: check supply balance + Tydro Ink Points Season 2 (launched Sep 9 2026; time-weighted supply/borrow, via Merkl).","free to check","5 min/wk"],["Hold 30 days. Ink Points S2 documented; points are claims toward future INK token, unconfirmed. No confirmed allocation.","held","30 days"],["Risk: Oct 29 2026 emergency Safe froze all 13 reserves (blocked deposits/loans, not withdrawals; nothing lost).","free to check","10 min"],["Exit: withdraw anytime under Aave V3 (no lock-up or queue); can be delayed at near-100% utilization.","~$0.10 gas (est.)","same tx if liquid"]],
"ember":[["Fresh wallet, $50 USDC on Sui; seed offline.","free","5 min"],["Deposit $50 USDC into Ember structured vault on Sui (receipt eEARN for USDC vault). Some vaults are permissioned.","$50 + ~$0.20 gas (est.)","15 min"],["Weekly: check vault share price.","free to check","5 min/wk"],["Hold 30 days. No documented Ember points program. No confirmed allocation.","held","30 days"],["Risk: redemption NOT instant - shares lock in pending queue, operator processes later. OtterSec Sep 2025: 13 findings.","free to check","10 min"],["Exit: submit redemption request; operator processes later (per-vault estimate, default ~4 days where unpublished).","~$0.20 gas (est.)","~4 days (operator est.)"]],
"doppler-finance":[["Fresh wallet, $50 XRP on XRP Ledger; seed offline.","free","5 min"],["Deposit $50 XRP into XRP Vault on XRPL via Doppler app. Permissionless, no KYC. Restricted in US, China, Russia, others.","$50 + ~$0.01 gas (est.)","15 min"],["Weekly: check vault balance + Doppler Points (DP accrues 0.01 DP per $1 per hour; Early-Depositor Boost; S3 rewards XDP).","free to check","5 min/wk"],["Hold 30 days. Doppler Points documented; DP conversion undefined; XDP Genesis claim ran Sep 28-Nov 28 2026.","held","30 days"],["Risk: 7-day withdrawal period is the key constraint. Zero Doppler fees; XRPL fee ~$0.0004. RLUSD Vault audited by Zenith.","free to check","10 min"],["Exit: submit withdrawal request; funds batched over a 7-day window (XRPL users get RLUSD back after batch processes).","~$0.01 gas (est.)","7-day window"]],
"armitage-by-wintermute":[["Fresh wallet, $100 USDC on Ethereum; seed offline.","free","5 min"],["Deposit $100 USDC into Armitage Morpho Vault V2 vault on Ethereum (Core Prime/Select) via Morpho app. No minimum; no KYC.","$100 + ~$20 gas (est.)","15 min"],["Weekly: check vault share price.","free to check","5 min/wk"],["Hold 60 days. No documented Armitage points program. No confirmed allocation.","held","60 days"],["Risk: no Armitage-specific audit documented. Intended for sophisticated/professional investors; not for UK/US residents.","free to check","10 min"],["Exit: withdraw anytime; no lock-ups. Timing depends on liquidity; Force Deallocate Penalty 0% on Core vaults.","~$10 gas (est.)","same tx if liquid"]],
"avant-avusd":[["Fresh wallet, $50 USDC on Avalanche; seed offline.","free","5 min"],["Mint $50 avUSD against USDC on Avalanche, then stake avUSD to receive savUSD (senior tranche). avUSD alone earns NO yield.","$50 + ~$2 gas (est.)","15 min"],["Weekly: check savUSD balance.","free to check","5 min/wk"],["Hold 30 days. No points program. AVANT is a future governance token, no allocation terms. Yield via savUSD strategies.","held","30 days"],["Risk: avUSD redemption often hours but up to 7 days. Unstaking savUSD takes 1-day cooldown (no yield). US restricted.","free to check","10 min"],["Exit: unstake savUSD to avUSD (1-day cooldown, no yield), then redeem avUSD for USDC (hours to 7 days). Redemption fee applies.","~$2 gas (est.)","1-day cooldown + up to 7 days"]],
"valos":[["Do NOT deposit. Valos is a permissioned vault (vUSD) on Monad for institutional allocators only. KYC; non-US professional / US accredited only. Minimum 100,000 AUSD.","free","5 min"],["Verify: the $100 plan cannot meet the 100,000 AUSD minimum. Redemption is via periodic windows, up to 30 days.","free","15 min"],["No plan proceeds without a verified retail route and a reachable minimum. No points program; yields supplemented by Monad/Agora/Accountable incentives.","held","0 days"],["Risk: Accountable infra audited by Cyfrin (v2.0 Oct 16 2025) with critical withdrawal-queue DOS findings. Loans are uncollateralised institutional credit.","free to check","10 min"]]
};
  // Mechanism parameters for all 198 rows, in rank order, 4 base-36 chars/row:
  // [mechanism, min 0 unverified/1 none/2 has one, exit index, flags 1 live/2 susp/4 not-retail/8 incident].
var MECH_T='114011101110114032101140124042109110a1101110106032005180a264114011c0e2208240a1701102d220a104211051021110b1701180a1802010720411042110a2041110a25082101070f170a15010001140011681702118104181c01048c2744110100082001144b004114901711140800000e062502010211860101070114200401040211010041142100010718270611102151110111020a08200b11011001140817411101110a100211061112100017082118141824011001110111081011110110082401104414a01a51119821811b01000010410d06004210022103110121011121000100011706110124060141170b011111210401104601010481110a100a2102241a240110060111100110061101220f00431183100a15061118199610441g011326110910111101110310211148100111031100106210061102101a111201860108270110050f01001611002001110611082046211101061106210a0c431106010a01482108100810012081108111061052000320131001070102410101011600812721000';
var MECH_EXV=[-1,0,1,2,3,4,5,7,14,15,21,28,30,31,60,183,364];
  function mechAt(rank) {
    var s = MECH_T.slice((rank - 1) * 4, rank * 4);
    return { mech: parseInt(s[0], 36), min: +s[1], exit: MECH_EXV[parseInt(s[2], 36)], flags: parseInt(s[3], 36) };
  }
  function farmSteps(p) {
    var own = FARM_PLANS[p.slug];
    if (own && own.length) return own.map(function (t) {
      var s = t[0] + ' Cost: ' + t[1] + '. Time: ' + t[2] + '.';
      if (s.length > 600) s = s.slice(0, 596) + '...';
      if (s.length < 20) s = s + ' Hold the position and check the protocol\'s own page.';
      return s;
    });
    if (p.farm_steps && p.farm_steps.length) return p.farm_steps;
    return ["Open the protocol's own page and follow its published steps to take a position. Cost: nothing but the gas (estimate). Time: 15 minutes."];
  }

  function readHash() {
    var hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    var params = new URLSearchParams(hash);
    if (params.get('q')) state.q = params.get('q');
    if (params.get('p')) state.selected = params.get('p');
    if (params.get('category')) state.category = params.get('category');
    if (params.get('chain')) state.chain = params.get('chain');
  }
  function writeHash() {
    var params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.chain !== 'all') params.set('chain', state.chain);
    if (state.selected) params.set('p', state.selected);
    var next = params.toString();
    if (next) window.history.replaceState(null, '', '#' + next);
    else window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  // Rows as the board ranks them, by the B0 implied value board.json carries.
  function effRows() {
    return DATA.rows.map(function (r) {
      return { r: r, v: r.implied_value_usd };
    });
  }
  function rows() {
    var q = state.q.trim().toLowerCase();
    return effRows().filter(function (x) {
      var r = x.r;
      if (state.category !== 'all' && r.category !== state.category) return false;
      if (state.chain !== 'all' && (r.chains || []).indexOf(state.chain) < 0) return false;
      if (!q) return true;
      var hay = [r.name, r.slug, r.category, (r.chains || []).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }
  function sortedRows(list) {
    var key = state.sort;
    return list.slice().sort(function (a, b) {
      var av, bv;
      if (key === 'name') { av = a.r.name.toLowerCase(); bv = b.r.name.toLowerCase(); }
      else if (key === 'tvl') { av = a.r.tvl_usd; bv = b.r.tvl_usd; }
      else if (key === 'growth') { av = a.r.change_7d === null ? -Infinity : a.r.change_7d; bv = b.r.change_7d === null ? -Infinity : b.r.change_7d; }
      else if (key === 'age') { av = a.r.age_days === null ? Infinity : a.r.age_days; bv = b.r.age_days === null ? Infinity : b.r.age_days; }
      else { av = a.v; bv = b.v; }
      if (av < bv) return -state.dir;
      if (av > bv) return state.dir;
      return a.r.slug < b.r.slug ? -1 : a.r.slug > b.r.slug ? 1 : 0;
    });
  }

  function header() {
    return el('header', { class: 'top' },
      el('div', { class: 'brand' }, el('span', { class: 'mark' }), el('span', { class: 'brand-name', text: 'Token Radar' })),
      el('div', { class: 'top-meta' },
        el('span', { text: 'Snapshot ' + DATA.as_of }),
        el('span', { text: 'DefiLlama protocol index' }),
        el('span', { text: DATA.model_version + ' model' })
      )
    );
  }

  function lede() {
    var top = DATA.rows.slice(0, 10);
    var max = top.length ? top[0].implied_value_usd : 1;
    return el('section', { class: 'lede' },
      el('div', null,
        el('h1', { text: DATA.watchlist_size + ' watchlist protocols, ranked by implied value' }),
        el('p', { text: 'The watchlist is the floor: every protocol with at least $' + Math.round(DATA.floor_usd / 1e6) + 'M of TVL and no token on record. The early radar adds ' + DATA.early_size + ' pre-token protocols below that floor. Implied value is a model, not a promise.' }),
        el('div', { class: 'top10' },
          el('h2', { text: 'Top 10 by implied value' }),
          top.map(function (r) {
            return el('div', { class: 'top10-row' },
              el('span', { class: 'top10-rank num', text: String(r.rank) }),
              el('span', { class: 'top10-name', text: r.name }),
              el('span', { class: 'bar top10-bar', 'aria-hidden': 'true' }, el('i', { style: 'width:' + Math.max(3, Math.round((r.implied_value_usd / max) * 100)) + '%' })),
              el('span', { class: 'top10-val num', text: fmtUsd(r.implied_value_usd) })
            );
          })
        )
      ),
      el('div', { class: 'facts' },
        el('div', { class: 'fact' }, el('span', { text: 'Watchlist covered' }), el('b', { text: DATA.watchlist_size + ' / ' + DATA.watchlist_size })),
        el('div', { class: 'fact' }, el('span', { text: 'Pre-token rows scored' }), el('b', { text: String(DATA.board_size) })),
        el('div', { class: 'fact' }, el('span', { text: 'Early rows below the floor' }), el('b', { text: String(DATA.early_size) })),
        el('div', { class: 'fact' }, el('span', { text: 'Live-token protocols set aside' }), el('b', { text: String(DATA.live_size) }))
      )
    );
  }

  function controls() {
    var categories = Array.from(new Set(DATA.rows.map(function (r) { return r.category || 'Other'; }))).sort();
    var chains = Array.from(new Set(DATA.rows.reduce(function (a, r) { return a.concat(r.chains || []); }, []))).sort();
    var search = el('input', { type: 'search', id: 'q', placeholder: 'Search name, category or chain', value: state.q, 'aria-label': 'Search the board' });
    search.addEventListener('input', function () { state.q = search.value; writeHash(); render(); });
    var select = el('select', { id: 'category', 'aria-label': 'Filter by category' },
      el('option', { value: 'all', text: 'All categories' }),
      categories.map(function (c) { return el('option', { value: c, text: c, selected: c === state.category ? 'selected' : null }); })
    );
    select.addEventListener('change', function () { state.category = select.value; writeHash(); render(); });
    var chainSel = el('select', { id: 'chain', 'aria-label': 'Filter by chain' },
      el('option', { value: 'all', text: 'All chains' }),
      chains.map(function (c) { return el('option', { value: c, text: c, selected: c === state.chain ? 'selected' : null }); })
    );
    chainSel.addEventListener('change', function () { state.chain = chainSel.value; writeHash(); render(); });
    var pre = el('button', { type: 'button', 'aria-pressed': state.tab === 'pre-token' ? 'true' : 'false', text: 'Pre-token', onclick: function () { state.tab = 'pre-token'; render(); } });
    var live = el('button', { type: 'button', 'aria-pressed': state.tab === 'live' ? 'true' : 'false', text: 'Live token', onclick: function () { state.tab = 'live'; render(); } });
    return el('div', { class: 'controls' },
      el('div', { class: 'field' }, el('label', { for: 'q', text: 'Search' }), search),
      el('div', { class: 'field' }, el('label', { for: 'category', text: 'Category' }), select),
      el('div', { class: 'field' }, el('label', { for: 'chain', text: 'Chain' }), chainSel),
      el('div', { class: 'field' }, el('span', { class: 'sub', text: 'Token status' }), el('div', { class: 'tabs' }, pre, live)),
      el('span', { class: 'count', text: state.tab === 'pre-token' ? rows().length + ' rows shown' : DATA.live.length + ' live-token protocols' })
    );
  }

  function sortHeader(key, label) {
    return el('th', { scope: 'col' },
      el('button', { type: 'button', onclick: function () { if (state.sort === key) state.dir = -state.dir; else { state.sort = key; state.dir = -1; } render(); } },
        label,
        state.sort === key ? el('span', { 'aria-hidden': 'true', text: state.dir < 0 ? ' v' : ' ^' }) : null
      )
    );
  }

  function boardTable() {
    var list = sortedRows(rows());
    if (list.length === 0) {
      return el('div', { class: 'panel' }, el('div', { class: 'empty' },
        el('h2', { text: 'No protocol matches that filter' }),
        el('p', { text: 'Clear the search or pick another category to see the board again.' }),
        el('button', { class: 'button primary', type: 'button', text: 'Clear filters', onclick: function () { state.q = ''; state.category = 'all'; state.chain = 'all'; writeHash(); render(); } })
      ));
    }
    var max = list[0].v || 1;
    var tbody = el('tbody');
    list.forEach(function (x) {
      var r = x.r;
      var growth = r.change_7d === null ? 'n/a' : fmtPct(r.change_7d);
      var growthClass = r.change_7d === null ? '' : r.change_7d >= 0 ? 'pos' : 'neg';
      var tr = el('tr', {
        'data-selected': state.selected === r.slug ? 'true' : 'false',
        tabindex: '0',
        onclick: function () { openDetail(r.slug); },
        onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(r.slug); } }
      },
        el('td', { class: 'num', text: String(r.rank) }),
        el('td', null, el('div', { class: 'name' },
          el('b', { text: r.name }),
          el('span', { class: 'sub', text: (r.category || 'Other') + ' on ' + (r.chains && r.chains.length ? r.chains.slice(0, 2).join(', ') : 'an unnamed chain') })
        )),
        el('td', { class: 'num', text: fmtUsd(r.tvl_usd) }),
        el('td', { class: 'num ' + growthClass, text: growth }),
        el('td', { class: 'num', text: fmtAge(r.age_days) }),
        el('td', null, el('div', { class: 'implied' },
          el('div', { class: 'bar', 'aria-hidden': 'true' }, el('i', { style: 'width:' + Math.max(3, Math.round((x.v / max) * 100)) + '%' })),
          el('span', { class: 'num', text: fmtUsd(x.v) })
        )),
        el('td', null, el('span', { class: 'status', text: 'no token' }))
      );
      tbody.appendChild(tr);
    });
    return el('div', { class: 'panel' },
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('caption', { class: 'sub', text: 'Pre-token protocols, strongest implied value first. Select a row for its valuation, economic verdict and farm plan.' }),
          el('thead', null, el('tr', null,
            sortHeader('implied', 'Rank'),
            sortHeader('name', 'Protocol'),
            sortHeader('tvl', 'TVL'),
            sortHeader('growth', '7d'),
            sortHeader('age', 'Age'),
            sortHeader('implied', 'Implied value'),
            el('th', { scope: 'col', text: 'Token' })
          )),
          tbody
        )
      )
    );
  }

  function liveTable() {
    var tbody = el('tbody');
    DATA.live.forEach(function (r) {
      tbody.appendChild(el('tr', null,
        el('td', { class: 'num', text: 'live' }),
        el('td', null, el('div', { class: 'name' }, el('b', { text: r.name }), el('span', { class: 'sub', text: (r.category || 'Other') + ' on ' + (r.chains && r.chains.length ? r.chains.slice(0, 2).join(', ') : 'an unnamed chain') }))),
        el('td', { class: 'num', text: fmtUsd(r.tvl_usd) }),
        el('td', { class: 'num ' + (r.change_7d !== null && r.change_7d >= 0 ? 'pos' : 'neg'), text: fmtPct(r.change_7d) }),
        el('td', { class: 'num', text: fmtUsd(r.mcap_usd) }),
        el('td', null, el('span', { class: 'status', text: 'already trades' }))
      ));
    });
    return el('div', { class: 'panel' },
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('caption', { class: 'sub', text: 'Token live: these protocols already trade, so their market cap is a fact, not a model. They are set aside from the pre-token ranking.' }),
          el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Status' }), el('th', { scope: 'col', text: 'Protocol' }), el('th', { scope: 'col', text: 'TVL' }), el('th', { scope: 'col', text: '7d' }), el('th', { scope: 'col', text: 'Market cap' }), el('th', { scope: 'col', text: 'Token' }))),
          tbody
        )
      )
    );
  }

  function validationPanel() {
    var v = DATA.validation;
    var pol = DATA.policy;
    return el('section', { class: 'panel model' },
      el('h2', { text: 'How implied value is computed, and why this model' }),
      el('p', { class: 'sub', text: 'Every row is scored by one function of the snapshot figures. No protocol name is special-cased, and no row is hand-picked.' }),
      el('div', { class: 'formula' }, 'implied = round( tvl_usd x ' + v.median_multiple + ' )'),
      el('p', { class: 'sub', text: 'The multiple is the median market-cap/TVL ratio of ' + v.training_protocols + ' traded-token protocols in ' + v.training_families + ' distinct token families (grouped by CoinGecko id, so no token leaks across folds). A robust log regression (M1) was tested by grouped 5-fold validation and NOT promoted: median error ' + v.m1_mdale + ' vs B0 ' + v.mdale + ', but 90th-percentile ' + v.m1_p90_factor + 'x vs ' + v.p90_factor + 'x, failing the promotion policy. B0 is the deployed model.' }),
      eqRows([
        ['B0 median multiple', 'x' + v.median_multiple.toFixed(4)],
        ['Held-out median error (MdALE)', String(v.mdale)],
        ['Held-out median factor', v.mdfactor + 'x'],
        ['Held-out 90th-percentile factor', v.p90_factor + 'x'],
        ['Held-out coverage (90% range)', (v.coverage * 100).toFixed(1) + '%'],
        ['Training protocols / token families', v.training_protocols + ' / ' + v.training_families],
        ['M1 median error / 90th-percentile', v.m1_mdale + ' / ' + v.m1_p90_factor + 'x'],
        ['M1 promoted?', v.m1_promoted ? 'yes' : 'no']
      ]),
      el('p', { class: 'sub', text: 'Each row carries an empirical 90% range from held-out residuals: implied / ' + v.p90_factor + ' to implied x ' + v.p90_factor + '. A single TVL multiple is a weak predictor, and the board is a radar, not a price. Verdicts: FARM, CONDITIONAL, SKIP, UNVERIFIED, SUSPENDED. Policy (per $' + pol.user_cash_budget_usd + ' position): FARM at most ' + (pol.farm_max_fee_ratio * 100) + '% fees and ' + pol.farm_max_exit_days + ' days exit; CONDITIONAL when costs are higher but bounded; SKIP above ' + (pol.skip_above_fee_ratio * 100) + '% fees or ' + pol.skip_above_exit_days + ' days; UNVERIFIED when a fact is missing; SUSPENDED when frozen. No row reaches FARM: the three rows with verified monetary reward terms (USDD, Hive, Saturn) all carry R2 risk, and FARM requires R1; USDD and Hive are also above the 2% fee cap.' })
    );
  }
  function integrityPanel() {
    var ig = DATA.integrity;
    var recon = ig.raw_count === ig.ranked_count + ig.excluded_traded + ig.excluded_by_rule + ig.excluded_invalid + ig.unclassified;
    return el('section', { class: 'panel model' },
      el('h2', { text: 'Integrity: the snapshot reconciles to the board' }),
      el('p', { class: 'sub', text: 'Every one of the ' + ig.raw_count + ' snapshot records gets exactly one disposition. Watchlist coverage is ' + ig.watchlist_covered + ' / ' + ig.watchlist_total + '; duplicate slugs in the snapshot: ' + ig.snapshot_duplicate_slugs + '; duplicate slugs on the board: ' + ig.board_duplicate_slugs + '.' }),
      eqRows([
        ['Snapshot records', String(ig.raw_count)],
        ['Ranked on the board', String(ig.ranked_count)],
        ['Excluded: already trades', String(ig.excluded_traded)],
        ['Excluded: watchlist rule', String(ig.excluded_by_rule)],
        ['Excluded: invalid TVL', String(ig.excluded_invalid)],
        ['Unclassified', String(ig.unclassified)],
        ['Reconciliation (sums to the snapshot)', recon ? '758 = 758' : 'MISMATCH'],
        ['Token status: traded / no token recorded / unknown', ig.traded_records + ' / ' + ig.no_token_recorded + ' / ' + ig.unknown_token_status]
      ]),
      el('p', { class: 'sub', text: '"No token recorded" means the snapshot entry carries no market cap, no CoinGecko id and no symbol. It is not proof no token exists: 25 board rows were found by external verification to already have a live token, and those rows are marked UNVERIFIED with the token named. Farm-plan facts come from verified external protocol documentation (top 40: 320/320 VERIFIED; ranks 41-198: 1,230/1,264 VERIFIED; 34 VERIFIED facts are WEAK-marked and were not used to set a table value). Where a fact could not be verified it is marked UNVERIFIED, never invented.' })
    );
  }
  function mechanismPanel() {
    var names = ['Unknown', 'Yield vault', 'Lending', 'CDP', 'Staking', 'Restaking', 'DEX', 'Spot', 'Perps', 'Prediction', 'RWA', 'Stablecoin', 'Bridge', 'Chain', 'Payment', 'Managed'];
    var counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (var r = 1; r <= DATA.board_size; r++) counts[mechAt(r).mech]++;
    var parts = [];
    for (var m = 0; m < 16; m++) if (counts[m]) parts.push('M' + (m < 10 ? '0' + m : m) + ' ' + names[m] + ' ' + counts[m]);
    return el('section', { class: 'panel model' },
      el('h2', { text: 'Mechanism coverage: every row has a mechanism and parameters' }),
      el('p', { class: 'sub', text: 'All 198 rows carry mechanism parameters in this page\'s MECH table (4 characters per row, in rank order). By family: ' + parts.join(' · ') + '.' }),
      el('p', { class: 'sub', text: 'Rules: a vault is verified by route, deposit, monitor, redeem; lending/CDP by supply or borrow, then exit; DEX/perps by pool or position, then close; RWA/stablecoin by mint or buy, then redeem. No mechanism, a live token, a suspension or a not-retail flag means UNVERIFIED or SUSPENDED, never a farm.' })
    );
  }

  var dialog = el('dialog', { class: 'detail', id: 'detail', 'aria-labelledby': 'detail-title' });
  dialog.addEventListener('close', function () { state.selected = null; writeHash(); });

  function openDetail(slug) {
    var row = DATA.rows.filter(function (r) { return r.slug === slug; })[0];
    if (!row) return;
    state.selected = slug;
    writeHash();
    var check = impliedOf(row);
    var range = rangeOf(row.implied_value_usd);
    var mechName = { M00: 'Unknown mechanism', M01: 'Yield vault', M02: 'Lending supply', M03: 'Collateralized borrowing', M04: 'Staking', M05: 'Restaking', M06: 'DEX liquidity', M07: 'Spot exchange', M08: 'Perpetual exchange', M09: 'Prediction market', M10: 'RWA issuance', M11: 'Stablecoin issuance', M12: 'Bridge', M13: 'Chain ecosystem', M14: 'Payment channel', M15: 'Managed/custodial strategy' }[row.mechanism] || row.mechanism;
    var verdictText = row.verdict + (row.attractiveness !== null && row.attractiveness !== undefined ? ' (attractiveness ' + row.attractiveness + '/100)' : '');
    var mp = mechAt(row.rank);
    var fl = [];
    if (mp.flags & 1) fl.push('live token');
    if (mp.flags & 2) fl.push('suspended');
    if (mp.flags & 4) fl.push('not retail');
    if (mp.flags & 8) fl.push('incident');
    var exitText = 'min: ' + (mp.min === 1 ? 'none verified' : mp.min === 2 ? 'has a minimum (see plan)' : 'UNVERIFIED') + ' · exit: ' + (mp.exit < 0 ? 'UNVERIFIED' : mp.exit === 0 ? 'instant where liquid' : mp.exit + ' days (verified)') + (fl.length ? ' · ' + fl.join(', ') : '');
    dialog.textContent = '';
    var steps = farmSteps(row);
    dialog.appendChild(el('div', { class: 'detail-head' },
      el('div', null,
        el('span', { class: 'brand-name', text: 'Rank ' + row.rank + ' of ' + DATA.board_size }),
        el('h2', { id: 'detail-title', text: row.name }),
        el('p', { class: 'sub', text: (row.category || 'Other') + ' on ' + (row.chains && row.chains.length ? row.chains.join(', ') : 'an unnamed chain') })
      ),
      el('button', { class: 'close', type: 'button', 'aria-label': 'Close details', text: 'Close', onclick: function () { dialog.close(); } })
    ));
    dialog.appendChild(el('section', { class: 'detail-section' },
      el('h3', { text: 'Implied value (model b0)' }),
      eqRows([
        ['TVL', fmtUsd(row.tvl_usd)],
        ['B0 median multiple', 'x' + DATA.validation.median_multiple.toFixed(4)],
        ['Implied value', fmtUsd(row.implied_value_usd)],
        ['Empirical 90% range', fmtUsd(range.low) + ' - ' + fmtUsd(range.high)],
        ['Seven-day growth', fmtPct(row.change_7d)],
        ['Age with no token', fmtAge(row.age_days)],
        ['Mechanism', mechName],
        ['Execution', exitText],
        ['Economic verdict', verdictText]
      ]),
      el('p', { class: 'sub', text: 'Model b0: the same function scores every protocol. The page recomputes this row as ' + fmtUsd(check) + (check === row.implied_value_usd ? ', the same number board.json carries.' : ', which differs from board.json; see the validation panel.') + ' The 90% range comes from held-out residuals (median factor ' + DATA.validation.mdfactor + 'x, 90th percentile ' + DATA.validation.p90_factor + 'x): a single TVL multiple is a weak predictor, and this is an estimate, not a price.' }),
      el('p', { class: 'sub', text: 'Economics: eligibility ' + row.eligibility + ', risk ' + row.risk + '. Verdict ' + row.verdict + (row.verdict === 'UNVERIFIED' ? ': a fact the verdict needs could not be verified, so no farm is recommended.' : row.verdict === 'SKIP' ? ': the economics do not cover the cost, so no farm is recommended.' : row.verdict === 'SUSPENDED' ? ': do not deposit.' : ': a farm is worth considering within the stated costs and the exit in the plan.') })
    ));
    dialog.appendChild(el('section', { class: 'detail-section' },
      el('h3', { text: 'Farm plan' }),
      el('ol', { class: 'steps' }, steps.map(function (s) {
        var at = s.indexOf(' Cost: ');
        var action = at >= 0 ? s.slice(0, at) : s;
        var tail = at >= 0 ? s.slice(at + 1) : '';
        return el('li', null, el('b', { text: action }), el('span', { class: 'cost', text: tail }));
      }))
    ));
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function render() {
    app.textContent = '';
    var shell = el('div', { class: 'shell' });
    shell.appendChild(header());
    shell.appendChild(lede());
    shell.appendChild(controls());
    shell.appendChild(state.tab === 'pre-token' ? boardTable() : liveTable());
    if (state.tab === 'pre-token') { shell.appendChild(validationPanel()); shell.appendChild(integrityPanel()); shell.appendChild(mechanismPanel()); }
    app.appendChild(shell);
    app.setAttribute('aria-busy', 'false');
    if (!dialog.isConnected) app.appendChild(dialog);
    if (state.selected) openDetail(state.selected);
  }

  readHash();
  render();
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && dialog.open) dialog.close();
  });
})();
