(function(){
'use strict';
var DATA=window.RADAR;
if(!DATA)return;
var app=document.getElementById('board');
var state={q:'',category:'all',chain:'all',tab:'pre-token',sort:'implied',dir:-1,selected:null};
var B0_MULTIPLE=0.21380325885644053;
var Q90_FACTOR=42.45;
var VAL={n:128,fam:128,folds:5,seed:'sha256(TR01+gecko_id)%5',m0:0.21380325885644053,q90:3.7484,fac:42.45,b0:[1.6311,5.11,42.45,0.0153,0.906],n0:[1.3329,3.79,79.48,0.1295,0.867],m1:[1.2260,3.41,51.57,0.2576,0.883],nest:0.898,sens:[0.2049,0.2227,0.1686,0.3247],seg:[['TVL low',43,5.46,23.00,0.930],['TVL mid',43,3.97,15.81,0.930],['TVL high',42,5.81,65.99,0.857],['Age <180d',3,3.23,0,1.000],['Age 180-365d',7,8.28,0,0.857],['Age >365d',85,4.19,29.87,0.918],['Age missing',33,6.20,65.99,0.879],['Complete features',95,4.53,31.09,0.916],['Missing age/growth',33,6.20,65.99,0.879],['Lending',15,4.19,0,0.933],['Dexs',11,6.20,0,1.000],['Liquid Staking',9,7.24,0,0.889],['Yield',9,4.07,0,0.889],['CEX',9,3.97,0,0.889],['RWA',9,2.17,0,1.000],['Canonical Bridge',8,5.46,0,0.750],['Basis Trading',7,4.06,0,0.857],['Bridge',6,5.63,0,1.000],['25 smaller categories',45,7.32,63.53,0.889]]};
function impliedOf(row){return Math.max(1,Math.round(row.tvl_usd*B0_MULTIPLE));}
function rangeOf(implied){return{low:Math.max(1,Math.round(implied/Q90_FACTOR)),high:Math.round(implied*Q90_FACTOR)};}
var NOFARM='No row currently passes every FARM gate.';
var MECH_H='Mechanism coverage: all 198 rows';
var LEDE_INTRO='Ranked by estimated token valuation. Execution verdicts independently assess verified rewards, eligibility, costs and risk. Neither ranking predicts launch probability.';
var DISC_LEDE='No protocol currently satisfies all six execution gates. The discovery queue prioritizes documented routes by verified gate readiness and identifies the exact evidence needed to establish economic viability. Research priority is not investment approval.';
var BLOCKED='BLOCKED: verified execution route unavailable. Do not deposit.';
function gateText(){return'Verdicts are computed by six FARM gates (all must pass; unknown inputs never pass): G1 documented monetary rewards, positive conservative net (points/variable yield: zero lower bound); G2 identified product, verified retail route, jurisdiction, token status; G3 verified minimum within capital; G4 R1 risk, no material incident (unresolved INC!, historical INC); G5 verified round-trip cost bound at most '+(POL.f*100)+'% of capital — every mandatory component (gas, fees, conversion, funding) bounded or inapplicable; estimated gas is not a bound; G6 verified complete exit within '+POL.fd+' days (sum of stage maxima, all stages covered). Precedence: SUSPENDED, SKIP (R3, incompatible eligibility, unaffordable minimum, documented fees above '+(POL.s*100)+'%, documented exit maximum or mandatory lock above '+POL.sd+' days), UNVERIFIED (any input unknown), FARM, CONDITIONAL (inputs known, a gate fails). R1: audited/long-running, no unresolved loss. R2: unaudited/novel, resolved incident, custodial/complex. R3: unresolved incident/structural loss. RU: insufficient risk facts. RS: suspended. Exit = complete capital exit: positions to sell/settle/resolve first, or liquidity-queued withdrawals, are unbounded; a mandatory lock and a documented maximum are distinct claims.';}
function factText(liveCount,ig){return'"No token recorded" = no market cap, CoinGecko id or symbol in the snapshot, not proof none exists: '+liveCount+' board rows were externally verified live-token (SKIP). Snapshot counts cover all '+ig.raw_count+' records; board counts the '+SLUGS.length+' ranked rows. Facts come from verified documentation (top 40: 320/320 VERIFIED; ranks 41-198: 1,230/1,264 VERIFIED; 34 WEAK facts never set table values). Unverifiable facts stay UNVERIFIED, never invented. Locators cite marked claims; exclusion proofs cite the fact behind each hard exclusion.';}
function coverageText(){return'Decision coverage: '+SLUGS.length+'/'+SLUGS.length+' · Identified execution routes: '+SLUGS.filter(function(s,i){return prodOf(i)!==null;}).length+'/'+SLUGS.length+' · Fully verified routes: '+SLUGS.filter(function(s,i){return evalOf(i).gates.every(function(g){return g!==-1;});}).length+'/'+SLUGS.length+' · Evidence-backed exclusions: '+DATA.rows.filter(function(r){var pr=PROOFS[idxOf(r.slug)+1];return(verdictOf(r)==='SKIP'||verdictOf(r)==='SUSPENDED')&&pr&&pr.length;}).length+'/'+DATA.rows.filter(function(r){return verdictOf(r)==='SKIP'||verdictOf(r)==='SUSPENDED';}).length+'.';}
var F='free',K='5 min/wk',T5='5 min',T10='10 min',T15='15 min',G1='~$0.10 gas (est.)',G2='~$0.20 gas (est.)',D='held',C='$100 + ~$0.20 gas (est.)',T30='30 days',WK='Weekly: check ',H3='Hold 30 days. ',RK='Risk: ',EX='Exit: ',NC='confirmed allocation',SP='share price',GE=' gas (est.)',DU='Deposit $100 USDC into ',PP='points program.',NP='No plan proceeds without a verified retail',PD='Points documented;',TX='same tx if liquid',U7='up to 7 days',H='$100 + ~$',WD='withdrawal',DC='documented',VO='vault on ';
function PL(s1,dep,dc,mon,rew,risk,exit,ec,et){return[[s1,F,T5],[dep,dc,T15],[WK+mon,F,K],[H3+rew,D,T30],[RK+risk,F,T10],[EX+exit,ec,et]];}
var FARM_PLANS={
"steakhouse-financial":PL("Fresh wallet, $100 USDC on Base; seed offline.",DU+"Steakhouse Prime USDC "+VO+"Base via Morpho app (0% fee on many Prime vaults; avoid Term vaults, locked to maturity).",C,""+SP+" + withdrawable % (Prime ~88% Nov 24 2026); [AF] no tx unless exit trigger hits.","No Steakhouse points; no "+NC+".","bad debt if collateral falls faster than liquidators act. Exit if "+SP+" falls >5%.","withdraw USDC on Base. Instant vaults settle same tx if liquid (Prime ~88% withdrawable). [AF]",G1,"same tx"),
"sentora-curator":PL("Fresh wallet, $100 USDC on Ink; seed offline.",DU+"Sentora Boring USDC "+VO+"Ink via Sentora app.",C,""+SP+" + pending redemptions (BoringVault redemption is async: solver fill or claim date, no fixed settlement). [AK]","No Sentora points; rewards are vault-specific campaigns only. No "+NC+".","BoringVault redemptions are async (request, then solver fill or claim date). [AK] Exit if "+SP+" falls >5%.","request redemption, then claim when a solver fills it or the claim date arrives. No fixed settlement time. [AK]",G1,"no fixed timeline"),
"gauntlet":PL("Fresh wallet, $100 USDC on Base; seed offline.",DU+"Gauntlet USDC Prime "+VO+"Base (0% performance fee) via Morpho app.",C,"vault "+SP+"; no tx unless exit trigger hits.","No Gauntlet points; USDC Prime shows 0.00% rewards. USD Alpha vault streams USDC incentives via Sablier (Jul 2025). No "+NC+".","Mar 22 2026 Resolv USR exploit cost Gauntlet Core ~$4.95M. [AD] Exit if "+SP+" falls >5%.","redeem instantly if liquid (USDC Prime ~87% withdrawable); forceDeallocate exit penalty up to ~2%. If utilization high, wait for repayments.",G1,TX),
"veda":PL("Fresh wallet, $100 USDC on Ink; seed offline.","Veda has no direct deposit app. Deposit $100 USDC into ether.fi Liquid "+VO+"Ink (Veda BoringVault tech).",C,""+SP+"; no yield during the "+WD+" queue (USD vaults: up to 7 days, one at a time). [AG]","No VEDA token, no Veda airdrop, no Veda points season open. No "+NC+".",""+WD+"s via BoringQueue (time-delayed, solver-based). [AG] ether.fi AtomicQueue exploited Sep 2026. [AH]","request "+WD+" via BoringQueue; USD vaults up to 7 days (Liquid ETH: 3 days); can fail if share value declined. [AG]",G1,U7),
"usdd":PL("Fresh wallet, $100 USDT on Tron; seed offline.","Swap $100 USDT to USDD 1:1 via Peg Stability Module (zero fee), then stake as sUSDD (~4% base rate, Feb 2026).",H+"2"+GE,"sUSDD balance + peg (collateral ~135% Nov 2026; ~2/3 of supply minted 1:1 by Smart Allocator).","USDD IS the token (~1.44B supply); no "+PP+" Yield is sUSDD rate. CDP mint not used: minimum mint 500 USDD (TRX-C).","USDD 1.0 depegged Jun 2022; TRON DAO removed 12,000 BTC (~$730M) from backing Aug 2024. Exit if USDD slips >2%.","unstake sUSDD, swap USDD back to USDT via PSM (1:1, zero fee). No queue or lockup.","~$2"+GE,"same tx"),
"upshift":PL("Fresh wallet, $100 USDC on Monad; seed offline.",DU+"Upshift "+VO+"Monad via app.upshift.finance. No Upshift vaults on Base.",C,""+SP+" + Upshift Points S2 (1x deposits, 5x bonus while TVL under $750M - active at $519M, up to 12x). [P]","Upshift Points S2 "+DC+" (since Jul 2 2025); [P] no token announced. No "+NC+".","Apr 18 2026 Kelp rsETH exploit cost hgETH vault ~$763K (~4.1%). US residents STRICTLY PROHIBITED. [Q]","requestRedeem, then claim after per-vault lag (WHYPE ~25h, uBTC ~3 days). Processed daily; instant redemption on some vaults (fee).",G1,"up to 3 days"),
"cian-yield-layer":PL("Fresh wallet, $100 USDC on Arbitrum; seed offline.",DU+"CIAN "+VO+"Arbitrum via cian.app.",C,""+SP+" + CIAN Voyage Points ("+DC+"; accrue on unleveraged deposit value). [U]","CIAN Voyage "+PD+" no token or conversion rate published. No "+NC+".","no audits published for CIAN (DefiLlama: zero); stETH vault: upgradeable proxy, 3-of-4 Safe, no admin delay. 8% performance fee + 0.02% exit fee. [V]","submit requestRedeem, wait for batched processing (stETH layer ~5 days). Rules vary by strategy.",G1,"~5 days"),
"nonce-capital":PL("Fresh wallet, $100 USDC on Optimism; seed offline.","Nonce has no standalone retail vault. Deposit $100 USDC into ether.fi Liquid "+VO+"Optimism (Nonce is curator).",C,""+SP+"; no yield during the "+WD+" queue (USD vaults: up to 7 days, one at a time). [AG]","No Nonce points; Nonce has no token. Any ether.fi rewards are ether.fi's, not Nonce's. No "+NC+".","ether.fi Liquid AtomicQueue exploited Sep 2026. [AI] US and UK users excluded from Liquid.","request "+WD+" via queue; USD vaults up to 7 days (Liquid ETH: 3 days). [AG]",G1,U7),
"polymarket-international":[["Fresh wallet, $100 USDC on Polygon; seed offline.",F,T5],["Deposit $100 USDC on Polygon; auto-wraps to pUSD (trading collateral since CLOB V2 cutover Apr 28 2026). [B]",C,T15],["Place limit orders within each market's max spread + minimum shares to earn Liquidity Rewards; 3-4 markets, cap $25 each. Taker fee 0.01-0.05. [A]",F,K],[H3+"Liquidity Rewards pay daily only if the day's rewards reach the $1 payout minimum; no rollover; rates vary by market. Net profitability is not established: fills can be adverse and positions must be sold or resolved to exit. No token; no "+NC+".",D,T30],[RK+"positions must be sold or resolved before the balance is withdrawable; exit timing depends on market liquidity and resolution dates and is not bounded. CTF Exchange V2 audited Mar 2026. Eligibility per Polymarket terms (geo restrictions apply). [C]",F,T10],[EX+"close or settle all positions first, then withdraw pUSD/USDC balance. No fee, no lockup once closed.",G2,"unknown"]],
"onre":PL("Fresh wallet, $100 USDC on Solana; seed offline.","Mint $100 ONyc in OnRe app by depositing USDC. Open Access is permissionless, no minimum; [L] US residents cannot mint. [M] Fees 0.75%/yr + 20% performance. [O]",H+"0.02"+GE,"ONyc balance + OnRe Points (live Sep 11 2025; 1 point per ONyc per day, multipliers up to 4x).","OnRe "+PD+" no token confirmed; points have no cash value. No "+NC+".","primary redemption is quarterly only (30-day notice window, fulfilled at quarter-end, pro-rata if oversubscribed). Retail relies on AMMs. [N]","sell ONyc on Solana AMM anytime (slippage risk), [N] or request quarterly redemption (fee >=0.30%). [O] Collateral in a regulated Bermuda insurance account. [M]","~$0.02"+GE,"AMM sale anytime"),
"opentrade":[["Do NOT deposit. OpenTrade is for professional investors and institutions only; KYC required to mint/redeem. [H]",F,T5],["Verify: check for a retail-accessible product. The xSOLY vault has a verified $1,000 USDC minimum (docs.opentrade.io); the barrier is institutional access.",F,T15],["If a retail route is later verified, confirm the 2-5 business day redemption at NAV first [H] (Prime+: 5-6% APY, professionals only).",F,T10],[NP+" route. No "+DC+" "+PP,D,"0 days"],[RK+"institutional-only, KYC-gated, 2-5 business day settlement. [H] Audited (Cantina Aug 2026). No known exploit.",F,T10]],
"rockawayx":PL("Fresh wallet, $100 USDC on Solana; seed offline.",DU+"RockawayX-curated Kamino USDC Earn "+VO+"Solana via Kamino app. No lockup.",H+"0.02"+GE,""+SP+" + any active Merkl/Morpho campaign for this vault (vault-specific, time-limited).","No RockawayX-wide points; per-vault campaigns renew or expire (two ended Nov 20-23 2026).","some RockawayX vaults are permissioned (e.g. Confidential RWA USDC). Verify permissionless first.","withdraw in a single tx, subject to lending liquidity. No lockup, no unbonding period.","~$0.01"+GE,TX),
"plume-vaults":PL("Fresh wallet, $100 USDC on Plume Mainnet; seed offline.",DU+"Plume Nest vault (e.g. nBASIS, nALPHA, nTBILL) on Plume Mainnet to mint nTOKEN.",H+"0.02"+GE,"vault "+SP+" and nTOKEN balance.","Plume Nest Points Season One (Nov 2025-Mar 2026, 1% supply) ENDED; [T] later season NOT verified.","Plume/Nest NOT available to US persons. Withdrawal varies by vault (same-day to 7-day cooldown).","instant redeem when liquid (with fees), or async ERC-7540 request-then-claim. Or sell nTOKEN on Rooster DEX.","~$0.01"+GE,U7),
"hyperithm":PL("Fresh wallet, $100 USDC on Monad; seed offline.",DU+"Hyperithm USDC Apex Morpho "+VO+"Monad via Morpho app (10% performance fee).",C,"share price and how much is withdrawable.","No Hyperithm-native points; Monad vaults earn Merkl incentives in WMON (~0.8-0.89% APR, ends Nov 30 2026).","at a reviewed pin only ~5.7% of hyperUSDCa was convertible within one day; 94.3% had no exit timeline. [S]","redeem vault token; processed from available liquidity, can wait when markets are fully lent. No fixed duration.",G1,"no fixed timeline"),
"bittensor-dtao":[["Fresh wallet, $100 of TAO on Bittensor chain; seed offline.",F,T5],["Stake TAO into a dTAO subnet via wallet (Talisman, SubWallet) or taostats. Min 0.002 TAO per stake; pool fee 0.05%.",H+"0.10"+GE,T15],[WK+"subnet alpha price vs TAO and validator take (default 18% of emissions). Rewards are TAO per epoch (~72 min).",F,K],["Hold 60 days. No points program, no airdrop; rewards are live TAO emissions, auto-compounded.",D,"60 days"],[RK+"Jul 2024 PyPI supply-chain attack stole ~32,000 TAO (~$8M) from wallets. Bittensor Terms exclude sanctioned countries. Exit if alpha falls >20% vs TAO.",F,T10],[EX+"unstake in a single tx; converts alpha back to TAO at pool price (slippage possible). No separate swap needed.",G1,"same tx"]],
"bitfi-basis":PL("Fresh wallet, $100 USDT on Base; seed offline.","Mint $100 bfUSD by depositing USDT on Base, then stake into Horizon vault (hbfUSD, low-risk) via app.bitfi.one.",C,"hbfUSD balance + BitFi Points (live; holding bfUSD/hbfUSD/pbfUSD/LP, quests, referrals, Galxe). [Y]","BitFi "+PD+" future airdrops based on total points. [Y] No token confirmed.","BitFi is CeDeFi - yield depends on off-chain trading. SlowMist audited bfUSD Dec 2025 (2 medium findings).","request "+WD+" from hbfUSD, claim bfUSD after settlement (1 epoch = 24h). Then redeem to USDT: standard ~3 days (zero fee) or instant (0.5%). [Z]",G2,"~3 days standard"),
"symbiotic":PL("Fresh wallet, $100 wstETH on Ethereum; seed offline.","Deposit $100 wstETH into permissionless Symbiotic "+VO+"Ethereum via Symbiotic app. No KYC gate "+DC+".",H+"10"+GE,""+SP+" + Symbiotic Points S2 (since Jan 2025; points/hr = vault TVL to adapters x 0.001).","Symbiotic "+PD+" no token confirmed, docs promise no conversion. No "+NC+".","funds remain slashable until epoch boundary. Curators may charge up to 5% admin fee. US/UK excluded by Terms.","submit withdraw request (burns shares, queues collateral), claim only after next vault epoch ends (1-2 epochs; up to ~14 days).","~$20"+GE,"up to ~14 days"),
"defi-saver-asset-management":[["Do NOT open a CDP with $100. Maker vaults need minimum 1 ETH collateral; Aave positions 0.1 ETH; CDP Automation 200 DAI debt. [K]",F,T5],["Verify: 0.1 ETH is roughly $300 - three times this plan's capital. Raise capital to meet the minimum first.",F,T15],["If capital is raised, open a Maker/Sky CDP or leveraged position (Aave, Compound, Maker, Spark, Morpho, Fluid) via app.defisaver.com.",F,T10],["No plan proceeds at $100. A CDP closes in one tx (debt repaid from collateral, remainder returned). DFS Rewards is a top-20 campaign (50,000 USDC); Season 1 ended Jun 2026.",D,"0 days"],[RK+"liquidation if collateral ratio falls below Maker minimum. DeFi Saver charges 0.25% on Boost/Repay/closing.",F,T10]],
"k3-capital":[["SUSPENDED. Do not deposit. On 18 Nov 2026 attackers drained K3's sBOLD vault of ~$3.42M in ~8 min via share-price manipulation. Contracts paused; post-mortem Nov 19 2026. [D]",F,T5],["No farm plan proceeds while vaults are paused and the incident is unresolved. Liquity V2 itself was unaffected. [D]",F,T5],["Re-check only after a remediation post-mortem, re-audit, and confirmation depositors are made whole.",F,T10]],
"mellow-core":PL("Fresh wallet, $100 ETH on Ethereum; seed offline.","Deposit $100 ETH into Lido Earn vault (earnETH) on Ethereum via stake.lido.fi or Mellow app.",H+"10"+GE,""+SP+" + Mellow Points (Lido docs: points remain depositor's on "+WD+").","Mellow Points accrue; no token confirmed. No "+NC+".","earnETH vault paused Apr 2026, "+WD+"s blocked 9+ days (rsETH losses); redemptions resumed by Nov 7 2026.","request "+WD+", claim after typical ~3 day wait (deposit wait up to ~24h; instant buffer covers part). Queued "+WD+"s cannot be cancelled.","~$20"+GE,"~3 days"),
"figure-markets-prime":[["Fresh wallet, $100 USDC on Provenance; complete KYC (SSN/ITIN + photo ID) first. Seed offline.",F,T5],["Buy $100 YLDS (SEC-registered yield-bearing stablecoin) and lend into Democratized Prime pool via Figure Markets app.",H+"0.02"+GE,T15],[WK+"pool lent-out share and YLDS balance. Pools backed by home equity, auto, small-business, crypto loans.",F,K],[H3+"YLDS pays yield as a registered yield-bearing stablecoin. [AC] No "+PP+" No "+NC+".",D,T30],[RK+"withdraw YLDS only up to available liquidity (pools 70-95% lent out Oct 30 2026). [AC] 0.5-point platform spread. [AC]",F,T10],[EX+"withdraw YLDS up to available liquidity, then redeem YLDS for dollars at face (as fast as same day). [AC]","~$0.01"+GE,"same day if liquid"]],
"hive-protocol":[["Fresh wallet, $100 of BTC; bridge it to B2 Network (BSquared). Seed offline.",F,T5],["Stake $100 BTC via Hive on B2 to safeguard B2 and receive $B2 tokens. Fee-free, instant reward activation. Stakes BTC, NOT USDC.",H+"5"+GE,T15],[WK+"staked BTC balance and $B2 rewards accrued (paid proportionally to BTC staked).",F,K],[H3+"Rewards are the live $B2 token, not a "+PP+" Minimum stake 0.001 BTC (2024 source; verify live).",D,T30],[RK+"no audits listed for Hive; no reported exploit. Official site restricts some countries/regions.",F,T10],[EX+"unstake; 1-day unstaking lock applies, then BTC is released. Cooperative close settles in ~1 confirmation.","~$5"+GE,"1-day unstaking lock"]],
"lagoon":PL("Fresh wallet, $100 USDC on Arbitrum; seed offline.",DU+"Lagoon ERC-7540 "+VO+"Arbitrum via Lagoon app or curator front-end. Some vaults are permissioned.",C,"share price and whether a settlement round is pending.","No Lagoon-native points; incentives are vault/curator-specific, not protocol-wide.","fully async ERC-7540; wait is one settlement round (daily 12:00 UTC window for some; DAMM funds days to weeks).","submit requestRedeem, wait for settlement at next NAV update, then claim via redeem/withdraw. No fixed schedule.",G2,"one settlement round"),
"clearstar":PL("Fresh wallet, $100 USDC on Base; seed offline.",DU+"Clearstar-curated Morpho "+VO+"Base (e.g. Base RWA, Core USDG) via app.morpho.org.",C,"vault "+SP+"; no tx unless exit trigger hits.","No Clearstar-native points; rewards are third-party/issuer-specific, not guaranteed.","no Clearstar-specific audit published. Hypernative monitoring on all Morpho vaults. Morpho Terms exclude Restricted Territories.","standard ERC-4626 redemption - withdraw immediately if liquid (Base RWA 99% withdrawable; Core USDG 100%).",G1,TX),
"lightning-network":[["Fresh wallet, $100 of BTC; run a Lightning node or use a Lightning wallet. Seed offline.",F,T5],["Open a payment channel on Bitcoin mainnet: lock $100 BTC into 2-of-2 multisig with a peer. Min funding 20,000 sats.",H+"5"+GE,T15],[WK+"channel liquidity and whether peer is online. Routing fees typically <$0.05 per payment; LSPs charge ~1% for inbound liquidity.",F,K],[H3+"Lightning is a payment protocol, not a yield product: no token, no points, no yield. Not a farm.",D,T30],[RK+"force-close locks broadcaster funds behind to_self_delay (typically 144 blocks, ~1 day, up to 2016 blocks, ~2 weeks).",F,T10],[EX+"cooperative close settles in ~1 confirmation (~10 min). Unilateral force-close locks funds behind to_self_delay.","~$5"+GE,"~10 min cooperative"]],
"r25":[["Do NOT deposit. R25 is vault infrastructure on Pharos/Sui; rcUSD needs KYC + eligible-holder status; vaults go to institutions.",F,T5],["Verify: check for a retail-accessible vault (Axil Prime Credit is a 3-month USDC vault via an institutional gateway).",F,T15],["rcUSD redemption is a conditional obligation: KYC'd holders deliver rcUSD to issuer RiftWriter for face-value USDC; capacity, fees, deadline undisclosed.",F,T10],[NP+" route. No audits listed; reserve composition undisclosed; issuer keys can mint rcUSD.",D,"0 days"],[RK+"no verified retail access, undisclosed reserves, issuer-key minting power. No token, no "+PP,F,T10]],
"b14g":[["SUSPENDED. Do not deposit. On Oct 31 2026 b14g staking was exploited for ~97M CORE. [E] Core hard fork Nov 2 recovered ~70% of CORE; B14g planned pro-rata repayment.",F,T5],["No farm plan proceeds while the incident is unresolved. The board still ranks b14g on snapshot TVL, but farm is frozen.",F,T5],["Re-check only after a published post-mortem, re-audit, and confirmation depositors were repaid pro-rata.",F,T10]],
"saturn":PL("Fresh wallet, $100 USDC on Monad; seed offline.","Retail cannot mint USDat directly (whitelisted only). Buy $100 USDat on secondary market (Curve USDC/USDat pool), stake into sUSDat vault (target 11%+ APY).",C,"sUSDat "+SP+" and STRC dividend flow.","sUSDat yield is STRC dividends (target 11%+ APY, "+DC+"). [AA] No Saturn "+PP,"no public audit references (reviewed May 2026). USDat backing migrated M0 $M to PYUSDx via proxy upgrade Aug 19 2026.","sUSDat redemptions are QUEUED - average ~3 days, max 7 days (Saturn must liquidate STRC first). [AB] Then sell USDat.",G2,"queued ~3 days, max 7"),
"figure-markets-exchange":[["Do NOT place an OTC trade. Figure Markets needs full KYC (name, address, DOB, gov ID; SSN/ITIN + photo ID). No documented retail OTC product.",F,T5],["Verify: retail products are spot trading (BTC, ETH, HASH vs fiat/USDC) and P2Prime margin lending, not OTC trading. NY residents cannot trade crypto.",F,T15],["If a verified retail route is confirmed, note min order (0.01 USD / 0.0001 USDC), 0.1% trade fee, fiat limits ($25k/24h ACH).",F,T10],[NP+" OTC route. No points program; occasional promotions exist.",D,"0 days"],[RK+"full KYC mandatory, geo restrictions, MPC custody, SIPC up to $500k. No known exploit "+DC+".",F,T10]],
"curvance":PL("Fresh wallet, $100 USDC on Monad; seed offline.","Supply $100 USDC to isolated two-token lending market on Monad via app.curvance.com (e.g. wsrUSD/USDC).",C,"market utilization + Curvance Bytes ("+DC+" since Nov 27 2025; deposits, loans, settlements earn Bytes).","Bytes "+DC+"; no published conversion to CVE; CVE has not launched. No "+NC+".","eBTC market paused since May 2026, WBTC lenders still cannot redeem. Emergency Council bypassed 5-day timelock Sep 30 2026.","withdraw anytime if liquid. Note: posting collateral/borrowing starts a 20-min hold blocking repay/withdraw.",G1,TX),
"galaxy-curation":[["Do NOT deposit via Galaxy. Galaxy Curator is institutional-only, distributed via Fireblocks Earn to 2,400+ institutions.",F,T5],["Note: underlying Morpho V2 vaults (Galaxy USDC on Arc, $105.3M) are permissionless and visible on Morpho app; Galaxy's own path is institutional.",F,T15],["If a retail route to the underlying vaults is verified, check the vault address, 7-day cap-raise timelock, and fees first.",F,T10],[NP+" route. No token, no "+DC+" "+PP,D,"0 days"],[RK+"institutional-only by design; no audit listed for Galaxy Curation product itself.",F,T10]],
"extended-perps":[["Fresh wallet, $50 USDC on Arc; seed offline.",F,T5],["Deposit $50 USDC on Arc (settlement migrated from Starknet Oct 22 2026; also via Ethereum/Base CCTP). Trade 300+ perps.","$50 + ~$0.20"+GE,T15],["Open a small perpetual position, $25 cap. 0% maker / 0.025% taker crypto; 0% / 0.010% RWA. Weekly: check margin ratio.",F,K],[H3+"Points program exists (carried across in Oct 22 migration); no conversion terms "+DC+". No "+NC+".",D,T30],[RK+"liquidation when margin ratio (maintenance margin / equity) exceeds 100%. The 66%/80% thresholds could NOT be verified.",F,T10],[EX+"close position, then withdraw USDC on Arc. Sub-second finality, no lock-up or queue. No 1-2 hour delay.",G1,"sub-second finality"]],
"lofty":[["Fresh wallet, $100 USDCa on Algorand; complete KYC/AML for bank deposits, positions over $200, withdrawals. Seed offline.",F,T5],["Buy $100 of fractional property tokens on Lofty marketplace. Minimum $50 per property token. 2.5% purchase fee.","$100 + $2.50 fee + ~$0.01"+GE,T15],[WK+"rental income (paid daily in USDC) and whether a buyer exists at your target price.",F,K],[H3+"Return is daily rental income in USDC ("+DC+"). No points program or token allocation.",D,T30],[RK+"no lock-up, but a sale needs a buyer at your price - no fill time assured. CA DFPI consent order Nov 14 2022 ($37,500).",F,T10],[EX+"sell on 24/7 marketplace (3% sale fee; instant orders +~2.5% per side). Proceeds to bank take up to 4 business days.","$3.00 fee + ~$0.01"+GE,"up to 4 business days"]],
"theo-network-thusd":PL("Fresh wallet, $100 USDC on Ethereum; seed offline.","Acquire $100 thUSD via Theo app and stake for sthUSD. Primary minting is permissioned (MINTER_ROLE); thBILL is KYC-gated.",H+"20"+GE,"sthUSD balance + thUSD Points (live since Jun 25 2026; holding, staking, vault deposits earn points).","thUSD "+PD+" no Theo token or airdrop announced. No "+NC+".","sthUSD unstaking via redemption queue averaging ~2 weeks. Core vault locks 3 months; Core+/Boost lock 6 months.","unstake sthUSD through redemption queue (~2 weeks avg), then sell thUSD. Do not use a locked vault for 30 days.","~$20"+GE,"queue ~2 weeks"),
"tydro":[["Do NOT supply. On 2026-10-29 Tydro's emergency Safe froze all 13 reserves (precautionary after the Binance hot-wallet drain; Tydro not hacked, nothing lost). [G] New deposits and loans are blocked; [G] reopening is not verified.",F,T5],["Verify: check app.tydro.com and Tydro's official channels for a confirmed reopening of deposits before sending any funds.",F,T15],["Withdrawals were not blocked by the freeze (Aave V3 mechanics, liquidity-dependent); existing suppliers can exit, [G] but no new position opens until reopening is verified.",F,T10],["No plan proceeds while deposits are frozen. Ink Points Season 2 terms are moot until the market reopens.",D,"0 days"],[RK+"deposits frozen since 2026-10-29; at the freeze one borrower held 93.7% of USDC debt with health factor sliding 1.50 to 1.33. [G]",F,T10]],
"ember":[["Fresh wallet, $50 USDC on Sui; seed offline.",F,T5],["Deposit $50 USDC into Ember structured "+VO+"Sui (receipt eEARN for USDC vault). Some vaults are permissioned.","$50 + ~$0.20"+GE,T15],[WK+"vault "+SP+".",F,K],[H3+"No "+DC+" Ember "+PP+" No "+NC+".",D,T30],[RK+"redemption NOT instant - shares lock in pending queue, operator processes later. OtterSec Sep 2025: 13 findings.",F,T10],[EX+"submit redemption request; the operator processes it later. Settlement time is Unknown (the per-vault figure is a non-binding operator estimate).",G2,"Unknown"]],
"doppler-finance":[["Fresh wallet, $50 XRP on XRP Ledger; seed offline.",F,T5],["Deposit $50 XRP into XRP Vault on XRPL via Doppler app. Permissionless, no KYC. Restricted in US, China, Russia, others.","$50 + ~$0.01"+GE,T15],[WK+"vault balance + Doppler Points (DP accrues 0.01 DP per $1 per hour; Early-Depositor Boost; S3 rewards XDP). [W]",F,K],[H3+"Doppler "+PD+" DP conversion undefined; XDP Genesis claim ran Sep 28-Nov 28 2026. [W]",D,T30],[RK+"7-day "+WD+" period is the key constraint. [X] Zero Doppler fees; XRPL fee ~$0.0004. RLUSD Vault audited by Zenith.",F,T10],[EX+"submit "+WD+" request; funds batched over a 7-day window (XRPL users get RLUSD back after batch processes). [X]","~$0.01"+GE,"7-day window"]],
"armitage-by-wintermute":[["Fresh wallet, $100 USDC on Ethereum; seed offline.",F,T5],[DU+"Armitage Morpho Vault V2 "+VO+"Ethereum (Core Prime/Select) via Morpho app. No minimum; no KYC.",H+"10"+GE,T15],[WK+"vault "+SP+".",F,K],["Hold 60 days. No "+DC+" Armitage "+PP+" No "+NC+".",D,"60 days"],[RK+"no Armitage-specific audit "+DC+". Intended for sophisticated/professional investors; not for UK/US residents.",F,T10],[EX+"withdraw anytime; no lock-ups. Timing depends on liquidity; Force Deallocate Penalty 0% on Core vaults.","~$10"+GE,TX]],
"avant-avusd":[["Fresh wallet, $50 USDC on Avalanche; seed offline.",F,T5],["Mint $50 avUSD against USDC on Avalanche, then stake avUSD to receive savUSD (senior tranche). avUSD alone earns NO yield.","$50 + ~$2"+GE,T15],[WK+"savUSD balance.",F,K],[H3+"No "+PP+" AVANT is a future governance token, no allocation terms. Yield via savUSD strategies.",D,T30],[RK+"avUSD redemption often hours but up to 7 days. Unstaking savUSD takes 1-day cooldown (no yield). US restricted.",F,T10],[EX+"unstake savUSD to avUSD (1-day cooldown, no yield), then redeem avUSD for USDC (hours to 7 days). Redemption fee applies.","~$2"+GE,"1-day cooldown + up to 7 days"]],
"valos":[["Do NOT deposit. Valos is a permissioned vault (vUSD) on Monad for institutional allocators only. KYC; non-US professional / US accredited only. Minimum 100,000 AUSD. [I]",F,T5],["Verify: the $100 plan cannot meet the 100,000 AUSD minimum. Redemption is via periodic windows, up to 30 days. [J]",F,T15],[NP+" route and a reachable minimum. No points program; yields supplemented by Monad/Agora/Accountable incentives.",D,"0 days"],[RK+"Accountable infra audited by Cyfrin (v2.0 Oct 16 2025) with critical "+WD+"-queue DOS findings. Loans are uncollateralised institutional credit.",F,T10]]
};
var SRC={A:"docs.polymarket.com/trading/fees",B:"docs.polymarket.com/v2-migration",C:"whalesays.com/is-polymarket-legal",D:"www.coindesk.com/tech/2026/11/19/ethereum-block-builders-received-the-most-in-a-usd3-4-million-vault-hack-data-shows",E:"bitquery.io/investigations/b14g-hack",G:"10k.nyxshcon.org/risk/tydro",H:"tokenterminal.com/explorer/projects/fivesigma/xppv",I:"privatecredit.therawbyte.com/token/vUSD?tab=made",J:"privatecredit.therawbyte.com/directory/accountable",K:"www.defisaver.com/features/leverage-management",L:"www.airdropstop.com/airdrops/onre",M:"solanaguides.com/onre-finance-airdrop",N:"signals.coincodecap.com/onre-review",O:"zeneca.farm/onre",P:"app.upshift.finance/points",Q:"docs.upshift.finance/resources/legal/terms-of-use",S:"pharos.watch/stablecoin/hyperusdca-hyperithm/",T:"www.plume.org/blog/meet-the-new-nest-real-yield-real-ownership",U:"www.gate.com/learn/articles/a-comprehensive-guide-to-cian/6936",V:"docs.cian.app/yieldlayer/for-users-quick-start/fees",W:"www.airdropstop.com/airdrops/doppler-finance",X:"www.ainvest.com/news/xrp-news-today-xrp-yield-experiment-earns-3-41-apr-doppler-fi-2505/",Y:"docs.bitfi.one/points-program/overview",Z:"docs.bitfi.one/developer/using-contract/unstake-bfusd",AA:"curation.yearn.fi/report/saturn-usdat/",AB:"www.coinlive.com/news-flash/1100598",AC:"altstreet.investments/platforms/reviews/figure-markets",AD:"github.com/the-tie/defi-risk-rating/blob/HEAD/defi/ratings/Morpho-Gauntlet-USDC-Core-Rating.md",AF:"www.steakhouse-financial.com/q-and-a/",AG:"help.ether.fi/en/articles/269720-typical-liquid-"+WD+"-timelines",AH:"blog.web3wagmi.com/veda-guide",AI:"10k.nyxshcon.org/risk/ether.fi-liquid",AK:"sentora.com/research/articles/how-to-integrate-sentora-smart-yield-vaults-into-your-platform"};
var SLUGS_T='sentora-curator|steakhouse-financial|gauntlet|veda|usdd|nonce-capital|upshift|bittensor-dtao|polymarket-international|onre|rockawayx|cian-yield-layer|defi-saver-asset-management|symbiotic|opentrade|mellow-core|hyperithm|lightning-network|bitfi-basis|plume-vaults|k3-capital|hive-protocol|r25|figure-markets-prime|b14g|clearstar|saturn|lagoon|theo-network-thusd|curvance|figure-markets-exchange|galaxy-curation|tydro|valos|armitage-by-wintermute|lofty|extended-perps|avant-avusd|doppler-finance|ember|stellar-defi-hub|keyrock|noble|tori-finance|loopscale-lending|infinifi|axis|ipor-fusion|circle-gateway|reti-pooling|gami-labs|arcus-perps|yuzu-money|usdcx|solv-strategies|mezo-earn|tulipa-capital|azverse-perps|firelight|nado-spot|current|project-0|arrakis-modular|shift-defi|re7-labs|vishwa|exponent-yield-exchange|flux-finance|3f|ultrayield-curator|makina|noon|aegis-yusd|project-x|plasma-one|felix-vaults|plasma-saving-vaults|mystic-finance-lending|decibel|hylo-protocol|origami-finance|y10k-capital|drakewell|vfat.io|flowdesk|anemoy-capital|marginfi-lending|xrpl-dex|templar-lending|bitlayer-ybtc-family|apex-omni|manta-cedefi|liminal-basis|zoo-finance|lulo|avant-aveth|gmx-solana|waterline|d2-finance|phoenix-perp|august-digital|adrastea-validator|xion-finance|gamma-research|risex|neutral-trade|agua|chain-fusion|nemo-trading|bisonfi|fira|native-credit-pool|felix-cdp|defindex|ultrayield-vaults|rocksolid-network|katana-pre-launch|hyperbeat-earn|communityv3|perena-vaults|tempo-stablecoin-dex|exponent-strategy-vaults|rif-on-chain|hakutora|9summits|nuva|agni-finance|strata-markets|syntetika|sygnum-fiusd-liquidity-fund|paimon|3jane-lending|estate-protocol|t3tris-finance|steer-protocol|syntropia|exponent-risk-tranching|stellar-dex|growihf|goose|bucket-cdp|strato-cdp|theo-network-thbill|fstswap|bouncebit-prime|tessera-v|qearn|yieldfi|snuggle|predict-fun|sharpbyte-capital|tau-labs|kava-mint|set-protocol|reya-perps|superearn|bima-cdp|abstract|vena-finance|manifest-trade|bend|binaryx-platform|vesu|byreal|antarctic|mev-capital|valantis-sthype-restaking|pangolins|icarus-cl|subfrost|block-analitica|stellar-amm|bulk|katana-dex|anthias-labs|syncswap|metalx-swap|defa-by-invoicemate|monolith-market|fluxion-network|vault-street|hertzflow|boros|turboflow-perps|aftermath-aflp|loopscale-curation|stablehodl|temple|granite|swan-dao|btcfi-cdp|mezzanine|damm-capital|alphagrowth|flying-tulip-ftusd|goonfi|monarq|nucleus';
var MECH_T='09lq5909lpv909lq5909ot990o9ryu09ot990c39rc0xsbwo1vayfi22i6nc09lr9c077cfc0qesn912hvzc25ix3i09lrjc09lrjc2xmh7f1qezzc22i59909m9192quymu22i9z90gszh912fad909lpv929me9i09lq5922f3jc0ehovc1jax3909mmn90guy1e24udr909ot9924tinc1qi32i08bgui33dcei22i58f07acgo09lpuf02flw61ovfoi0gukek077jfu1ptdwi086u6j2k2tcl0xs1so07acgo1qi2si0a7d0i27axso09ql7v02enjr09lrii1lm2ol0225gi1c3kei0ehoki0gukek177msi085aci09m68i00iio607af8i0gt0ki07814o09m90f077c4i077j5u1qezoi19sf5u04w5rr09oumi09osyf0eelgi1qezoi29sisi09lr8i09ouci1o19kl09log909lrii22f0go0gt0ui19s5ml0gt0ki02ef4l1qia3u1o3upu1qxfkl09lr8i09loqo0apvoi1o0rlu09lr8i09logo1qi32i09mj030v9fkh03y65i09ni3v1qjmmj09ouci077a6o02ef460938ui178bs60gsxso0j7cwo0o6g4i09osyf09m3go077b0f077aqf09orko19s5ml0c06mi17an4l09oumi2781q009m68i077c4i09ouci17dqil078vyk09uz6f22i3ko24wlgi0j7mpu24tfko09lr83177mz609lpuf09lrii19s5cl0c03uo3040i00o9jii0o074o22f38i19sdrr1pisbw19mqw60xlvuo09p9ci19s5cl1vaxh609lrii09lr8i0o0m4o09ruyl1o3nyi09lpuf0o6gei02fna00gsxso19s5cl0gt67r22f7i00eg5aj17gw4i1rj44i09logo100aoo07aji019v9uf04sx0i09lr8i19s5cl1qi2si1c9nr90779co19s6ql1c9nkl203ogo0qku4l17gw4i201d4o1ql5wi1o3noi1o0kki0c4qip09nb2k09ouci19p9jx0eeioo0qeta00o3a8o08hk0o07814o077aqf07aji017c6ym0c3ogi077c4i';
var MECH_EXV=[-1,0,1,3,5,7,8,14,15,21,30,31,60];
var MINUSD_R='7:10,34:100000,36:50,37:5,49:5,52:5,60:5,73:1,75:10,79:10,91:10,93:500,100:1,105:20,112:10,120:1,131:10,132:1000,133:50,139:5,165:10,173:10,174:1,177:1,182:10,185:1,190:1000';
var FEEPCT_R='8:0.1,12:0.02,13:0.25,29:0.1,36:5.5,44:0.1,73:0.1,80:2,96:0.05,121:0.6,123:0.5';
var FEEZERO_R='5,19,30,35,39,45,47,95';
var GASZERO_R='177';
var GASUPPER_R='';
var REWARDFLOOR_R='';
var XFER_R='5:2,8:1,9:1,10:1,22:1,27:1,36:1,39:1,72:1,83:1,121:1,143:1,150:1,162:1';
var STAGES_R='38:1-7,96:1-7,165:7-1';
var EXITMIN_R='38:1,59:30,96:1,103:21,167:14';
var PDIC={"~M":" Morpho vaults","~V":" vault","~C":"-curated ","~P":" perps","~A":" account","~S":" staking","~D":" DEX","~L":" lending","~K":" mint","~F":" fund","~T":" token","~B":" bridge","~G":" margin","~R":" route","~E":" Earn"};
var ROUTES_T='Sentora Boring USDC~V (Smart Yield)|USDC;Steakhouse~CMorpho~V|USDC;Gauntlet~CMorpho~V|USDC;ether.fi Liquid~V (Veda BoringVault)|USDC;sUSDD~S via PSM swap|TRX;ether.fi Liquid~V (Nonce-curated)|ETH;Upshift~V|USDC;Subnet alpha~S|TAO;Polymarket CLOB (pUSD)|USDC;ONyc~K|USDC;RockawayX-curated~M|USDC;CIAN Yield Layer~V|stETH;DeFi Saver CDP/leverage dashboard|ETH;Symbiotic~V|wstETH;Prime+ Vault (xPPV)|USDC;Lido~E~Vs (Mellow)|ETH;Hyperithm USDC Apex~V|USDC;Lightning payment channel|BTC;bfUSD Horizon/Pulsar~S|USDT;Nest~Vs (Plume)|pUSD;K3-curated~Vs|RSETH;B2 Hive BTC~S|BTC;rcUSD / curator~Vs (R25 app)|USDC;Democratized Prime pools|YLDS;b14g dual-staking|BTC;Clearstar-curated~M|WETH;USDat~K/stake|USDC;Lagoon ERC-7540~V|USDC;thUSD Core~Vs|thUSD;Curvance isolated~L markets|USDC;Figure Markets exchange|USD;Galaxy-curated~M (Fireblocks~E)|USDC;Tydro~L market|USDT0;RWA Backed Lending by Valos~V|AUSD;Armitage~CMorpho Vault V2|USDC;Lofty property~Ts|USDC (USDCa);Extended~P~G~A|USDC;avUSD~K/stake|USDC;Doppler XRP/RLUSD~Vs|XRP;Ember structured~V|USDC;Sentora USDC~V (Stellar DeFi Hub)|USDC;Keyrock-curated~M|USDC;|USDC;trUSD~K + strUSD~S|trUSD;Loopscale Genesis~Vs|USDC;iUSD~K + siUSD~S|USDC;Axis Ecosystem Vault (Upshift)|USDT;IPOR Fusion Atomist Plasma Vaults|USDC;Circle Gateway Wallet|USDC;Reti incentivized~S pools|ALGO;Gami risk-curator~Vs (EARNUSDC)|USDC;Arcus~P~G~A|USDG;yzUSD~K + syzUSD~S|yzUSD;USDCx~K via xReserve|USDC;BTC+ meta-vault|cbBTC;Mezo~E BTC Vault|tBTC;Tulipa-curated~Vs|USDC;AZverse~P~G~A|USDT;Firelight Vault (FXRP cover)|FXRP;Nado unified-margin~A|USDT0;Current MainMarket~L|USDC;Project 0~L banks|USDC;Arrakis MetaVault (public~V)|token pair;Shift delta-neutral~Vs|USDC;Re7-curated~M|USDC;|BTCvc;Exponent PT/YT yield exchange|USDC;Flux fToken~L|USDC;3F leveraged RWA~Vs (JAAA)|USDC;UltraYield~M|USDC;Makina Operator\'s Machine~V|USDC;USN~K + sUSN~S|USDT;YUSD~K (Aegis)|USDT;Project X CLMM pools|HYPE;Plasma One~E~V (P1USD)|USDT;Felix-curated~M|USDC;Plasma Saving Vaults (Lending Vault)|USDT0;Mystic~Cearn~Vs|pUSD;Decibel~P~A (usDCBL)|USDC;hyUSD/xSOL~K (collateral pool)|SOL;lovToken~Vs|wstETH;Y10k USDC Vault (eY10K)|USDC;USDdw structured products|USDC;|any supported token;Flowdesk AUSD RWA Morpho Vault V2|AUSD;Anemoy AAA CLO~F (Centrifuge)|USDC;marginfi banks via Project 0|SOL;XRPL native~D/AMM|XRP;Templar isolated~L markets|BTC;YBTC.B Vaults|YBTC.B;ApeX Omni~P~A|USDT;Manta CeDeFi contracts|BTC;Liminal xTokens/limUSD|USDC;Zoo structured-yield~Vs|wSEI;Lulo auto-allocated~L|USDC;avETH~K + savETH~S|ETH;GMX Solana GLV~Vs /~P|SOL;Waterline-curated~M|USDC;D2 options~Vs (ETH++/USDC++)|USDC;Phoenix~P trader~A|USDC;|;Adrastea validator~S|SOL;|XION;Gamma Hypervisor~V|token pair;XLP Vault (RISEx)|USDC;Neutral Trade~Vs (Drift infra)|USDC;Global Carry Vault (Agua)|USDC;|BTC (as ckBTC);NEMO USDC Prime~V|USDC;|;Fira fixed-rate~L (Bond Tokens)|USDC;Native Credit Pool (single-sided supply)|USDT;feUSD CDP (Felix)|HYPE;Defindex~Vs (USDC Blend Fixed)|USDC;UltraYield main~Vs (UltraUSD)|USDC;RockSolid liquid~Vs (rETH/USDm)|USDC;Katana pre-launch Yearn~Vs|ETH;Hyperbeat~E meta-vaults|HYPE;CommunityV3 Uniswap V3 pools|USDC;Perena Vault V2 (USD*)|USDC;Tempo Stablecoin~D|USDC;Exponent Strategy Vaults|USDC;USDRIF~K (RIF On Chain)|RIF;Hakutora-curated~M|USDC;9Summits flagship Lagoon~Vs|cbBTC;NUVA~Vs (nvYLDS)|USDC;Agni~D pools (Mantle)|token pair;Strata tranche~Vs (srUSDe/jrUSDe)|USDe;Syntetika hBTC~Vs|BTC;FIUSD~Tized money-market~F|USDC;Paimon Prime~V (PP)|USDT;USD3~K (3Jane Morpho pool)|USDC;Estate fractional property~Ts|USDC;|USDC;Steer Smart Pools|token pair;Syntropia tranche~Vs (synUSD+)|USDC;Exponent Senior/Junior tranches|ONyc;Stellar native~D/AMM|XLM;Growi~V (Hyperliquid)|USDC;|;Bucket Tank CDP (USDB)|SUI;STRATO CDP~Vs|BTC;thBILL~Tized T-Bill basket|USDC;FSTSwap pools|token pair (BEP-20);BounceBit Prime~Vs|BENJI;|USDC;Qearn~S contract|QUBIC;yUSD~V|USDC;Snuggle CL~Vs|cbBTC;Predict.fun markets|USDT;SharpByte USDT Prime Morpho V2~V|USDT;TAU-curated~Vs|USDC;USDX CDP (Kava Mint)|HBTC;TokenSets (Set Tokens)|ERC-20 basket;Reya~P~G~A|USDC;Super Vault (SuperEarn)|USDT;BIMA CDP (USBD~K)|WBTC;|;Vena money market|;Manifest spot~D / Destiny Vaults|PYUSD;BendDAO~L pool|ETH;Binaryx~Tized properties|USDT;Vesu isolated pools|wBTC;Byreal CL pools|USDC;Antarctic~P~A|USDT;MEV Capital-curated~Vs|USDC;Valantis stHYPE restaking~V|stHYPE;Pangolin~D pools|AVAX;Icarus CL pools (RISE)|IRS;Subfrost frBTC wrap/vaults|BTC;BA Labs~CMorpho/Spark~Vs|USDC;Stellar protocol AMM pools|XLM;Bulk~P~G~A|USDC;Katana~D pools (Ronin)|RON;Anthias~CMorpho V2~Vs|USDC;SyncSwap pools|ETH;Metal X AMM pools (XPR)|XPR;DEFA invoice-factoring pools (LIFT)|USDC;Monolith CDP factory (own stablecoin)|wstETH;Fluxion~D pools (Mantle)|USDC;primeUSD/CARRY (Vault Street)|USDC;HertzFlow~P pools|USDT;Boros rate markets (Pendle)|WETH;TurboFlow~P~A|USDT;afLP~V (Aftermath)|USDC;Loopscale curated Vaults (Genesis)|USDC;StableHodl~S|USDT;TEMPLE~S (TempleDAO)|TEMPLE;Granite BTC~L (Stacks)|sBTC;swanUSD CDP (Monolith)|wstETH;BtcUSD CDP (BTCfi)|WBTC;Mezzanine tranching~Vs (Hastra)|USDC;DAMM Stablecoin Fund|USDC;AlphaGrowth-curated~M|USDC;ftUSD~K (Flying Tulip)|USDC;GoonFi V2 pools|WSOL;MXRPY yield~V (Monarq/Upshift)|FXRP;Nucleus managed~Vs|USDC';
var SRC_ADD={"P1":"www.cryptensive.com/projects/reviews/usdd","P2":"taostats.io/docs/concepts/staking/staking-in-dtao","P3":"crypto-economy.com/b%C2%B2-network","P4":"www.galaxy.com/newsroom/galaxy-launches-institutional-vault-curator","P5":"reinvestone.com/library/reinvest-vs-lofty","P6":"docs.gemwallet.com/blockchains/noble","P7":"blog.kraken.com/product/asset-listings/infi-is-available-for-trading","P8":"blog.web3wagmi.com/solv-guide","P9":"mezo.org/blog/mezo-earn-incentive-guide","P10":"www.weex.com/news/detail/firelight-forces-xrp-linked-tokens-lockup-as-withdrawal-delay-queue-grows-ukav3a9cditci7ayrgeq527j","P11":"tradingstrategy.ai/trading-view/ethereum/vaults/re7-usdc-core","P12":"se.ro/research/article/373ed85e-a042-41b2-a14c-a2ef0f491d85","P13":"tradingstrategy.ai/vaults/ultrayield-usdt-core","P14":"airdrops.io/noon","P15":"prjcx.exchange","P16":"expat-llc.com/en/guides/plasma-one-review","P17":"drakewell.fi/spydw","P18":"www.coinperps.com/learn/apex-omni-tutorial","P19":"www.chaincatcher.com/en/article/2124998","P20":"liminal.money/faq","P21":"followin.io/en/feed/17176713","P22":"pr.mysugarhousejournal.com/article/August-Raises-New-Funding-After-Quietly-Hitting-dollar7B-in-Volume-Proving-Institutions-Never-Left-Crypto/67ceea31c610d6aa18298cb5","P23":"stake.quicknode.com/validators/adraBKLNY3DL3pg6SJRDYiMA8BsznaWpUdE42X41gbP","P24":"www.btcc.com/en-US/price/xion","P25":"www.mintscan.io/xion/parameters?scrollAnchor=wasm","P26":"skybitcoins.com/dapp/gamma-strategies","P27":"capital-layer.fund/en/research/inbox-2026-10-26-1649-f54fe5f4","P28":"cryptonews.net/news/finance/32094005","P29":"tradingstrategy.ai/vaults/edge-ultrayield-cluster-5","P30":"wiki.rifonchain.com/en/faq","P31":"tradingstrategy.ai/trading-view/ethereum/vaults/hakutora-dai","P32":"www.ainvest.com/news/3jane-isn-bridging-defi-consumer-lending-building-shadow-bank-2606","P33":"app.rwa-xyz.com/assets/USD3","P34":"hindenrank.com/blog/how-does-fstswap-work","P35":"www.cryptowalletbasics.com/bouncebit-points-potential-airdrop","P36":"docs.bouncebit.io/bouncebit-cedefi/bouncebit-prime/faq","P37":"bitrss.com/solana-dark-exchange-humidifi-dominates-trading-with-record-34bn-volume-138414","P38":"tradingstrategy.ai/trading-view/arbitrum/vaults/yieldfi-yusd-4","P39":"pharos.watch/learn/case-studies/usdx-kava-2022","P40":"www.web3raider.com/news/abstract-l2-wind-down-dec-2026","P41":"mixbytes.io/blog/benddao-protocol-overview","P42":"DeFiLlama.com/protocol/binaryx-platform","P43":"coinranking.com/coin/gK7JG2sEW+pangolin-png/about","P44":"www.hypernative.io/insights/blog/how-vault-street-rebuilt-its-security-model-around-automatic-freezes-and-monitoring-as-code","P45":"yellow.com/asset/temple","P46":"holder.io/coins/swan-5","P47":"pharos.watch/stablecoin/swanusd-swan","P48":"tradingstrategy.ai/vaults/damm-stablecoin-fund-5","P49":"www.coingecko.com/en/coins/flying-tulip","P50":"docs.shyield.finance/mainnet_gap_analysis"};
var PROOFS_R='5:T:P1,8:T:P2,15:E:H,21:S:D,22:T:P3,25:S:E,32:E:P4,33:S:G,34:E:I,34:M:I,36:C:P5,43:S:P6,46:T:P7,55:T:P8,56:T:P9,59:X:P10,65:S:P11,69:E:P12,70:S:P13,72:T:P14,74:T:P15,75:T:P16,83:E:P17,91:T:P18,92:T:P19,93:M:P20,97:T:P21,101:E:P22,102:S:P23,103:T:P24,103:X:P25,104:T:P26,109:X:P27,110:E:P28,115:S:P29,123:T:P30,124:S:P31,132:T:P32,132:M:P33,144:T:P34,145:T:P35,145:X:P36,146:E:P37,148:S:P38,153:S:P39,158:S:P40,161:T:P41,162:T:P42,168:T:P43,181:E:P44,188:T:P45,190:T:P46,190:M:P47,193:E:P48,195:T:P49,197:S:P50';
var INC_R={"33":"Oct 29 2026 emergency freeze of all 13 reserves (precautionary; nothing lost).","45":"Nov 2026 exploit ~$412K + ~$521K NAV inflation.","48":"Jan 2026 exploit $336K.","55":"Mar 2026 exploit ~$2.73M, compensated.","62":"Drift exploit ~$1.91M bad debt.","102":"Pivoted Dec 2025; restaking token services shut down Dec 4 2025.","104":"Jan 2024 exploit $3.4-6M.","105":"Aug 3 2026 unauthorized 673,011.56 USDC withdrawal.","128":"Neutrl markets suspended.","145":"Aug 2026 exploit ~$3M BB; native L1 shut down.","163":"Sep 2026 oracle incident $3M, 95% recovered.","185":"Apr 2026 exploit ~$1.14M.","186":"Nov 5 2026 exploit ~$412K.","196":"Mar 2026 exploit ~$254K."};
var SUSP_R={"33":"All 13 reserves frozen 2026-10-29 (precautionary); new deposits blocked, reopening unverified.","43":"Circle pauses Noble USDC + CCTP Jan 12 2027.","65":"Deposits disabled; TVL down >95%.","70":"Bad debt realized; TVL down >95%.","102":"Restaking token services shut down Dec 4 2025; protocol pivoted to Solana infrastructure.","115":"Abandoned; TVL down >95%.","124":"Abandoned; TVL down >95%.","148":"Abandoned; TVL down >95%.","153":"Dead CDP; USDX depegged May 2022 ~$0.70.","158":"Chain shuts down Dec 15 2026; unbridged funds inaccessible.","197":"FXRP vault withdrawals revert; funds deployed off-vault; no payout, no ETA (Nov 18 2026)."};
var NORETAIL_R={"43":"Winding down; not a farm.","69":"Not retail-executable.","83":"Not retail-executable.","101":"Institutional only.","110":"Not retail-executable.","146":"Not retail-executable.","158":"Chain winding down; not a farm.","181":"Not retail-executable.","193":"Not retail-executable."};
var LIVE_R={"46":"INFI","55":"SOLV","56":"MEZO","72":"NOON","74":"PRJX","75":"XPL","91":"APEX","92":"MANTA","97":"GMX","103":"XION","104":"GAMMA","123":"RIF","132":"JANE","144":"FIST","145":"BB","161":"BEND","162":"BNRX","168":"PNG","188":"TEMPLE","190":"SWAN","195":"FT"};
var GAS_R={"Base":0.1,"Arbitrum":0.1,"Optimism":0.1,"Ink":0.1,"Monad":0.1,"Pharos":0.1,"Sui":0.1,"Arc":0.1,"Binance":0.1,"Ethereum":10,"Solana":0.01,"Plume":0.01,"Avalanche":1,"Bitcoin":5,"Tron":1,"Bittensor":0.1,"Provenance":0.01,"Algorand":0.01,"Ripple":0.01,"Polygon":0.1,"Katana":0.1,"Unichain":0.1,"Plasma":0.1,"Hyperliquid L1":0.1,"Flare":0.1,"Robinhood Chain":0.1,"BSquared":0.1,"Manta":0.1};
var MECH_NAMES=['Unknown','Yield vault','Lending','CDP','Staking','Restaking','DEX','Spot','Perps','Prediction','RWA','Stablecoin','Bridge','Chain','Payment','Managed'];
var POL={f:0.02,s:0.05,fd:7,sd:30};
var CAPS=[50,100,150,250];
function pMap(s){var o={},a=s.split(',');for(var i=0;i<a.length;i++){if(!a[i])continue;var p=a[i].split(':');o[+p[0]]=p.length>1?p[1]:1;}return o;}
var _pm=[MINUSD_R,FEEPCT_R,FEEZERO_R,GASZERO_R,XFER_R,STAGES_R,EXITMIN_R,GASUPPER_R,REWARDFLOOR_R].map(pMap),MINUSD_M=_pm[0],FEEPCT_M=_pm[1],FEEZERO_M=_pm[2],GASZERO_M=_pm[3],XFER_M=_pm[4],STAGES_M=_pm[5],EXITMIN_M=_pm[6],GASUPPER_M=_pm[7],REWARDFLOOR_M=_pm[8];
for(var _sk in SRC_ADD)SRC[_sk]=SRC_ADD[_sk];
var SLUGS=SLUGS_T.split('|');
var IDX={};SLUGS.forEach(function(s,i){IDX[s]=i;});
function idxOf(slug){var i=IDX[slug];return i===undefined?-1:i;}
var ROUTES=ROUTES_T.split(';').map(function(r){var p=r.split('|');return[p[0]||'',p[1]||''];});
function prodOf(i){var s=ROUTES[i]?ROUTES[i][0]:'';for(var k in PDIC)s=s.split(k).join(PDIC[k]);return s||null;}
function assetOf(i){return ROUTES[i]&&ROUTES[i][1]?ROUTES[i][1]:null;}
var PROOFS={};PROOFS_R.split(',').forEach(function(e){var p=e.split(':');(PROOFS[+p[0]]=PROOFS[+p[0]]||[]).push([p[1],p[2]]);});
function mechAt(i){
var v=parseInt(MECH_T.slice(i*6,i*6+6),36);
var inc=v%3;v=(v-inc)/3;var rt=v%5;v=(v-rt)/5;var pr=v%2;v=(v-pr)/2;var cap=v%4;v=(v-cap)/4;var tok=v%3;v=(v-tok)/3;var risk=v%5+1;v=(v-(risk-1))/5;var elig=v%5;v=(v-elig)/5;var flags=v%32;v=(v-flags)/32;var xi=v%14;v=(v-xi)/14;var min=v%3;
return{mech:(v-min)/3,min:min,exit:MECH_EXV[xi],flags:flags,elig:elig,risk:risk,token:tok,cap:CAPS[cap],product:pr===1,rewardType:rt,incident:inc};
}
function inputAt(i){
var m=mechAt(i),rank=i+1;
return{capital:m.cap,minCode:m.min,minUsd:MINUSD_M[rank]!==undefined?+MINUSD_M[rank]:null,product:m.product,asset:assetOf(i)!==null,rewardType:m.rewardType,rewardLower:REWARDFLOOR_M[rank]!==undefined?+REWARDFLOOR_M[rank]:0,feePct:FEEPCT_M[rank]!==undefined?+FEEPCT_M[rank]:null,feeZero:!!FEEZERO_M[rank],gasZero:!!GASZERO_M[rank],gasUpper:GASUPPER_M[rank]!==undefined?+GASUPPER_M[rank]:null,xfer:XFER_M[rank]!==undefined?+XFER_M[rank]:0,mech:m.mech,elig:m.elig,risk:m.risk,incident:m.incident,flags:m.flags,tokenCode:m.token,exitStages:STAGES_M[rank]?STAGES_M[rank].split('-').map(Number):(m.exit<0?null:[m.exit]),exitMin:EXITMIN_M[rank]!==undefined?+EXITMIN_M[rank]:null,exitComplete:m.exit>=0};
}
function evaluate(x){
var fin=function(v){return typeof v==='number'&&isFinite(v);};
var g=[-1,-1,-1,-1,-1,-1],per=[[],[],[],[],[],[]],hard=false,cb=false,cu=0;
function U(i,c){per[i].push(c);}
function F(i,c){g[i]=0;per[i].push(c);}
var gub=x.gasUpper!==null&&x.gasUpper!==undefined&&!(fin(x.gasUpper)&&x.gasUpper>=0);
var flok=fin(x.flags)&&x.flags%1===0&&x.flags>=0&&x.flags<=31,fl=flok?x.flags:0;
var feeBad=(x.feePct!==null&&x.feePct!==undefined&&!(fin(x.feePct)&&x.feePct>=0))||(x.feeZero===true&&fin(x.feePct)&&x.feePct>0);
var gasBad=x.gasZero===true&&fin(x.gasUpper)&&x.gasUpper>0;
var mb=!fin(x.mech)||x.mech%1!==0||x.mech<0||x.mech>15;
if(fin(x.capital)&&x.capital>0&&!gub&&!feeBad&&!gasBad&&(x.gasZero===true||(fin(x.gasUpper)&&x.gasUpper>=0))&&(x.feeZero===true||(fin(x.feePct)&&x.feePct>=0))&&(x.xfer===0||x.xfer===2)&&!mb&&x.mech!==8){cb=true;cu=(x.gasZero===true?0:x.gasUpper)+(fin(x.feePct)?x.feePct/100*x.capital:0);if(!fin(cu)){cb=false;cu=0;}}
if(cb){var r=cu/x.capital;if(r<=POL.f)g[4]=1;else{F(4,'COST!');if(r>POL.s)hard=true;}}
else if(fin(x.feePct)&&x.feePct/100>POL.s){F(4,'COST!');hard=true;}
else U(4,'COST?');
if(x.rewardType===4&&fin(x.rewardLower)&&x.rewardLower>=0){if(!cb)U(0,'NET?');else if(x.rewardLower-cu>0)g[0]=1;else F(0,'NET!');}
else if(x.rewardType===3){if(cb)F(0,'NET!');else U(0,'NET?');}
else if(x.rewardType===1)F(0,'POINTS');
else if(x.rewardType===2)F(0,'NET!');
else U(0,'REWARD?');
var g2f=false,g2u=false;
if(flok&&(fl&4)!==0){per[1].push('ELIG!');hard=true;g2f=true;}
if(x.tokenCode===1){per[1].push('TOKEN!');hard=true;g2f=true;}
if(x.tokenCode===2||!fin(x.tokenCode)||x.tokenCode%1!==0||x.tokenCode<0||x.tokenCode>2){per[1].push('TOKEN?');g2u=true;}
if(x.mech===0||mb||x.product!==true||x.asset!==true){per[1].push('ROUTE?');g2u=true;}
if(x.elig===4||!fin(x.elig)||x.elig%1!==0||x.elig<0||x.elig>4||!flok||(fl&16)!==0){per[1].push('ELIG?');g2u=true;}
g[1]=g2f?0:g2u?-1:1;
if(x.minCode===1)g[2]=1;
else if(x.minCode===2){if(!fin(x.minUsd)||x.minUsd<0)U(2,'MIN?');else if(fin(x.capital)&&x.minUsd>x.capital){F(2,'MIN!');hard=true;}else if(!fin(x.capital))U(2,'MIN?');else g[2]=1;}
else U(2,'MIN?');
if(x.incident===2){g[3]=0;per[3].push('INC!');if(x.risk===3){per[3].push('R3');hard=true;}}
else if(x.incident===1){g[3]=0;per[3].push('INC');if(x.risk===3){per[3].push('R3');hard=true;}}
else if(x.risk===1&&x.incident===0)g[3]=1;
else if(x.risk===2&&x.incident===0)F(3,'R2');
else if(x.risk===3&&x.incident===0){F(3,'R3');hard=true;}
else U(3,'RISK?');
var et=null;
if(x.exitComplete===true&&Array.isArray(x.exitStages)&&x.exitStages.length>0&&x.exitStages.every(function(s){return fin(s)&&s>=0;}))et=x.exitStages.reduce(function(a,b){return a+b;},0);
if(et!==null&&!fin(et))et=null;
if(x.exitMin!==null&&(!fin(x.exitMin)||x.exitMin<0))U(5,'EXIT?');
else if(et===null){U(5,'EXIT?');if(fin(x.exitMin)&&x.exitMin>POL.sd){per[5].push('EXIT!');hard=true;}}
else if(fin(x.exitMin)&&x.exitMin>et){U(5,'EXIT?');if(x.exitMin>POL.sd){per[5].push('EXIT!');hard=true;}}
else if(et<=POL.fd)g[5]=1;
else{F(5,'EXIT!');if(et>POL.sd||(fin(x.exitMin)&&x.exitMin>POL.sd))hard=true;}
var blockers=per[0].concat(per[1],per[2],per[3],per[4],per[5]),verdict;
if((flok&&(fl&2)!==0)||x.risk===5){blockers.unshift('SUSP');verdict='SUSPENDED';}
else if(hard)verdict='SKIP';
else if(g.some(function(v){return v===-1;}))verdict='UNVERIFIED';
else if(g.every(function(v){return v===1;}))verdict='FARM';
else verdict='CONDITIONAL';
return{verdict:verdict,gates:g,blockers:blockers,hard:hard,costBounded:cb,costUpper:cu,exitTotal:et};
}
var EVALS={};
var FAILCLOSED={verdict:'UNVERIFIED',gates:[-1,-1,-1,-1,-1,-1],blockers:['ROUTE?'],hard:false,costBounded:false,costUpper:0,exitTotal:null};
function evalOf(i){if(i<0)return FAILCLOSED;if(!EVALS[i])EVALS[i]=evaluate(inputAt(i));return EVALS[i];}
function verdictOf(r){return evalOf(idxOf(r.slug)).verdict;}
function tokenLabel(r){
var i=idxOf(r.slug);if(i<0)return'Unknown';
var t=mechAt(i).token;
return t===1?'Live token':t===2?'Unknown':'No token recorded';
}
function discovery(i){
var x=inputAt(i),e=evalOf(i),g=e.gates,p=0,f=0;
g.forEach(function(v){if(v===1)p++;else if(v===0)f++;});
return{i:i,p:p,f:f,u:6-p-f,d:6-p,rt:x.rewardType,v:e.verdict,inc:x.incident,route:prodOf(i)!==null&&assetOf(i)!==null};
}
function tierOf(d){
if(d.v==='SKIP'||d.v==='SUSPENDED')return'X';
if(d.f>0)return'C';
if(!d.route||d.inc===2)return'C';
return d.rt===3||d.rt===4?'A':'B';
}
function discoveryAll(){
var out=[];
for(var i=0;i<SLUGS.length;i++){var d=discovery(i);d.t=tierOf(d);out.push(d);}
out.sort(function(a,b){
var ta='ABCX'.indexOf(a.t),tb='ABCX'.indexOf(b.t);
if(ta!==tb)return ta-tb;
if(a.p!==b.p)return b.p-a.p;
if(a.f!==b.f)return a.f-b.f;
if(a.i!==b.i)return a.i-b.i;
return SLUGS[a.i]<SLUGS[b.i]?-1:1;
});
return out;
}
function remediation(i){
var x=inputAt(i),e=evalOf(i),g=e.gates,out=[],cmax=POL.f*x.capital;
if(g[0]!==1){
if(x.rewardType===4)out.push('G1: verified reward lower bound must strictly exceed the cost upper bound'+(e.costBounded?' ($'+e.costUpper.toFixed(2)+')':' (cost bound also unverified)')+'; currently $'+x.rewardLower+'.');
else if(x.rewardType===3)out.push('G1: document a positive USD reward floor strictly above the total cost upper bound'+(e.costBounded?' ($'+e.costUpper.toFixed(2)+')':'')+'; variable yield floor is currently $0.');
else if(x.rewardType===1)out.push('G1: points have zero monetary value; a documented monetary reward with floor above cost is required.');
else if(x.rewardType===2)out.push('G1: no monetary reward documented; required: documented monetary reward with floor above the cost bound.');
else out.push('G1: establish the reward terms; required: verified USD reward floor strictly above the total cost upper bound.');
}
if(g[1]!==1){
var miss=[];
if(x.mech===0||x.product!==true)miss.push('product');
if(x.asset!==true)miss.push('deposit asset');
if(x.elig===4||!(typeof x.flags==='number'&&isFinite(x.flags)&&x.flags%1===0&&x.flags>=0&&x.flags<=31)||(x.flags&16)!==0)miss.push('retail eligibility/jurisdiction');
if(x.tokenCode===2)miss.push('token status');
if(typeof x.flags==='number'&&isFinite(x.flags)&&x.flags%1===0&&x.flags>=0&&x.flags<=31&&(x.flags&4)!==0)miss.push('retail access (currently excluded)');
if(x.tokenCode===1)miss.push('pre-token status (token already live)');
out.push('G2: verify '+(miss.length?miss.join(', '):'eligibility')+'.');
}
if(g[2]!==1){
if(x.minCode===2&&x.minUsd!==null&&x.minUsd>x.capital)out.push('G3: verified minimum $'+x.minUsd+' exceeds planned capital $'+x.capital+' by $'+(x.minUsd-x.capital)+'; raise capital or verify a lower minimum.');
else if(x.minCode===2)out.push('G3: verify the minimum deposit in USD (a minimum exists; amount unverified).');
else out.push('G3: verify the minimum deposit (currently unverified).');
}
if(g[3]!==1)out.push('G4: R1 classification with evidence and no unresolved incident required (currently '+['','R1','R2','R3','RU','RS'][x.risk]+(x.incident===2?', unresolved incident':x.incident===1?', historical incident':'')+').');
if(g[4]!==1){
if(e.costBounded)out.push('G5: verified round-trip cost $'+e.costUpper.toFixed(2)+' exceeds the '+(POL.f*100)+'% ceiling $'+cmax.toFixed(2)+' by $'+(e.costUpper-cmax).toFixed(2)+'.');
else out.push('G5: complete verified round-trip cost must be ≤ $'+cmax.toFixed(2)+' ('+(POL.f*100)+'% of $'+x.capital+'); currently unbounded — bound gas, fees, conversion and funding (estimates are not bounds).');
}
if(g[5]!==1){
if(e.exitTotal!==null)out.push('G6: verified complete exit '+e.exitTotal+' days exceeds '+POL.fd+' by '+(e.exitTotal-POL.fd)+'; a verified reduction of at least '+(e.exitTotal-POL.fd)+' day(s) is required.');
else out.push('G6: verify every mandatory exit stage; stage maxima must sum to ≤'+POL.fd+' days'+(x.exitMin?' (mandatory lock '+x.exitMin+' days documented)':'')+'.');
}
return out;
}
var ENTRY_T={1:['the vault route','deposit $C'],2:['the lending market','supply $C'],3:['the CDP vault, collateral asset and minimum ratio','open a $C collateralized position'],4:['the staking pool, asset and cooldown','stake $C'],5:['the restaking vault, collateral asset and epoch rules','restake $C'],6:['the pool, assets and fee tier','provide $C of liquidity'],8:['the market, margin asset and liquidation metric','deposit $C as margin'],9:['the market, collateral and eligibility','fund $C and place one position'],10:['eligibility, the asset and redemption terms','subscribe $C'],11:['the mint/redeem rules and collateral','mint $C of the stable asset'],12:['the bridge route, asset and settlement','bridge $C'],15:['access, custody, fees and redemption','allocate $C']};
var RISK_T={1:['vault contract + curator loss','the vault share price falls >5%'],2:['borrower default + utilisation spikes','utilisation tops 90%'],3:['liquidation if collateral falls','the collateral ratio falls below the verified minimum'],4:['slashing + cooldown lock','the validator is slashed'],5:['slashing + epoch withdrawal delay','a slashing event is reported'],6:['impermanent loss if pool assets diverge','the pool ratio moves >5%'],8:['liquidation on adverse moves','the margin ratio approaches liquidation'],10:['redemption gates + issuer default','redemption is gated'],11:['depeg + redemption failure','the peg slips >2%'],12:['bridge failure + settlement delay','the bridge halts'],15:['custodian + contract risk','the custodian freezes withdrawals']};
var ELIG_T=['No points program or reward documented.','Reward eligibility is speculative; no verified allocation terms.','A documented points program exists; check its terms on the protocol page.','Verified monetary reward terms; see the plan for the rate.','Reward eligibility UNVERIFIED.'];
function holdDays(age){return age===null||age===undefined?30:age<180?60:age<365?45:30;}
function gasFor(chain){return GAS_R[chain]!==undefined?GAS_R[chain]:0.1;}
function txsFor(mech){return mech===0?0:(mech===3||mech===6)?3:2;}
var VT={'COST?':'a verified round-trip cost bound','EXIT?':'a verified complete-exit bound','NET?':'a documented reward floor above the cost bound','REWARD?':'the reward terms','POINTS':'a monetary reward (points are worth $0 here)','NET!':'a monetary reward above cost (none documented)','ROUTE?':'the product, asset and retail route','ELIG?':'retail eligibility and jurisdiction','TOKEN?':'the token status','MIN?':'the minimum deposit in USD','RISK?':'the risk classification','INC':'the incident resolution','INC!':'the unresolved incident','R2':'an R1 risk profile'};
function verifyTasks(blockers){var seen=[];blockers.forEach(function(b){var t=VT[b]||b;if(seen.indexOf(t)<0)seen.push(t);});return seen.join('; ');}
function mechEntryT(n,mech,capital,chain,minCode,minUsd,product,asset){
var min=minCode===2&&minUsd!==null?' Minimum deposit $'+minUsd+' (verified).':minCode===1?' No minimum deposit documented.':' Minimum deposit UNVERIFIED.';
var t=ENTRY_T[mech];
if(!t)return"Verify the mechanism, route, asset and minimum on "+n+"'s own page before sending funds. No executable route is established from the snapshot.";
var wa=mech<=2&&asset?' ('+asset+')':'';
var into=product?' into '+product:'';
return'Verify '+t[0]+wa+" on "+n+"'s own page, then "+t[1].replace('$C','$'+capital)+into+' on '+chain+'.'+min;
}
function mechRiskT(mech,incident){
var inc=incident?' Incident: '+incident:'';
if(mech===9)return'Risk: a position can go to zero. Cap each position at $25.'+inc;
var t=RISK_T[mech];
if(!t)return'Risk: mechanism unknown. Do not deposit until the route, asset, minimum and exit are verified from the protocol docs.'+inc;
return'Risk: '+t[0]+'. Exit if '+t[1]+'.'+inc;
}
function stepStr(text,cost,time){var s=text+' Cost: '+cost+'. Time: '+time+'.';return s.length>600?s.slice(0,596)+'...':s;}
function routeSteps(p){
var own=FARM_PLANS[p.slug];
if(own&&own.length)return own.map(function(t){return stepStr(t[0],t[1],t[2]);});
var i=idxOf(p.slug);
if(i<0)return[BLOCKED];
var rank=i+1,m=mechAt(i),inp=inputAt(i);
var chain=p.chains&&p.chains.length?p.chains[0]:'its main chain';
var capital=inp.capital,hold=holdDays(p.age_days),n=p.name;
var setup=['Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.','free','5 min'];
var incident=INC_R[rank];
var steps=[setup];
if((m.flags&2)!==0){
steps.push(['SUSPENDED: do not deposit into '+n+'. '+(SUSP_R[rank]||'Suspended pending verification.'),'do not deposit','now']);
steps.push(["If you already hold a position, check "+n+"'s own page for the official exit or repayment notice before moving funds.",'free','15 min']);
return steps.map(function(t){return stepStr(t[0],t[1],t[2]);});
}
if((m.flags&1)!==0){
var tok=LIVE_R[rank]||'a live token';
steps.push([n+' already has a live token ('+tok+') trading, so the "pre-token launch" premise does not apply. The snapshot records no token, so this row is ranked as pre-token, but a launch has already happened.','free to verify','15 min']);
steps.push(['Do not farm '+n+' for a launch allocation. If you want exposure, buy '+tok+' on a market instead and size it like any traded token.','held',hold+' days']);
steps.push(['Risk: the implied value is not applicable to a protocol that already trades. '+(incident?'Incident: '+incident:'Check the protocol docs for current status.'),'free','10 min']);
return steps.map(function(t){return stepStr(t[0],t[1],t[2]);});
}
if((m.flags&4)!==0){
steps.push([n+' is not executable for a retail user. '+(NORETAIL_R[rank]||'Not retail-executable.'),'free to verify','15 min']);
steps.push(['Do not attempt a $'+capital+" retail deposit: no verified retail route exists. If access changes, re-verify eligibility and minimums on the protocol's own page first.",'held',hold+' days']);
steps.push(['Risk: institutional / permissioned access. '+(incident?'Incident: '+incident:'Check the protocol docs for current status.'),'free','10 min']);
return steps.map(function(t){return stepStr(t[0],t[1],t[2]);});
}
if(m.mech===0){
steps.push([mechEntryT(n,0,capital,chain,m.min,inp.minUsd,null,null),'free to verify','15 min']);
steps.push(['No executable route is established from the snapshot for '+n+'. Do not send funds until the route, asset, minimum and exit are verified from its docs.','held',hold+' days']);
steps.push([mechRiskT(0,incident),'free','10 min']);
return steps.map(function(t){return stepStr(t[0],t[1],t[2]);});
}
var exit=m.exit;
var exitText=exit<0?'Settlement time is UNVERIFIED; verify the withdrawal mechanism before depositing.':exit===0?'Withdrawal is instant where the vault holds idle liquidity.':'Withdrawal takes about '+exit+' day'+(exit===1?'':'s')+' (verified).';
var eligText=ELIG_T[m.elig]||ELIG_T[4];
var fee=Math.round(txsFor(m.mech)*gasFor(chain)*100)/100;
var feeText=fee>0?'$'+fee+' total gas (est., '+txsFor(m.mech)+' txs on '+chain+')':'gas (est., UNVERIFIED)';
var ev=evalOf(i);
if(ev.verdict==='SKIP'){
var hardList=ev.blockers.filter(function(b){return b.slice(-1)==='!'||b==='R3';});
var notes=[];
if(hardList.indexOf('MIN!')>=0)notes.push('Documented minimum $'+inp.minUsd+' exceeds the $'+capital+' planned capital.');
if(hardList.indexOf('COST!')>=0)notes.push('Documented round-trip fees breach the 5% SKIP threshold.');
if(hardList.indexOf('EXIT!')>=0)notes.push(ev.exitTotal!==null?'Documented complete exit exceeds 30 days.':'Mandatory exit lock exceeds 30 days.');
if(hardList.indexOf('R3')>=0)notes.push('R3 risk classification (unacceptable).');
if(hardList.indexOf('TOKEN!')>=0)notes.push('A live token already trades.');
steps.push(['Do not deposit: proven hard exclusion ('+hardList.join(', ')+'). '+notes.join(' '),'do not deposit','now']);
steps.push(['Reconsider only if the exclusion no longer applies; re-verify eligibility, minimum, cost and exit from primary docs first.','free',hold+' days']);
steps.push([mechRiskT(m.mech,incident),'free','10 min']);
return steps.map(function(t){return stepStr(t[0],t[1],t[2]);});
}
if(ev.verdict==='UNVERIFIED'){
var minT=m.min===2&&inp.minUsd!==null?' Minimum deposit $'+inp.minUsd+' (verified).':m.min===1?' No minimum deposit documented.':' Minimum deposit UNVERIFIED.';
var vp=ENTRY_T[m.mech]?ENTRY_T[m.mech][0]:'the mechanism, route, asset and minimum';
steps.push(['Do not deposit yet. Verify '+vp+" on "+n+"'s own page on "+chain+'.'+minT+' Still unverified: '+verifyTasks(ev.blockers)+'.','free to verify','15 min']);
steps.push(["Weekly: re-check "+n+"'s docs for the missing items; no transaction until every FARM gate passes. "+eligText,'free','10 min/wk']);
steps.push(['No position is opened: research queue only. Re-run the gates when the missing facts are verified.','free',hold+' days']);
steps.push([mechRiskT(m.mech,incident),'free','10 min']);
steps.push(["Exit, if a position is ever opened: verify the withdrawal mechanism on "+n+"'s own page first. "+exitText,'free to verify',exit<0?'UNVERIFIED':exit===0?'instant':'~'+exit+' days']);
return steps.map(function(t){return stepStr(t[0],t[1],t[2]);});
}
steps.push([mechEntryT(n,m.mech,capital,chain,m.min,inp.minUsd,prodOf(i),assetOf(i)),feeText,'15 min']);
steps.push(["Weekly: check the position and the protocol's own rewards page; no transaction unless the exit trigger hits. "+eligText,'free','10 min/wk']);
steps.push(['Hold '+hold+' days. '+eligText,'held',hold+' days']);
steps.push([mechRiskT(m.mech,incident),'free','10 min']);
steps.push(['Exit at '+hold+"d or on trigger: verify the withdrawal mechanism on the protocol's own page first, then withdraw on "+chain+'. '+exitText,feeText,exit<0?'UNVERIFIED':exit===0?'instant':'~'+exit+' days']);
return steps.map(function(t){return stepStr(t[0],t[1],t[2]);});
}
var usd=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
function fmtUsd(n){
if(n==null||!isFinite(n))return'n/a';
if(Math.abs(n)>=1e9)return'$'+(n/1e9).toFixed(2)+'B';
if(Math.abs(n)>=1e6)return'$'+(n/1e6).toFixed(1)+'M';
if(Math.abs(n)>=1e3)return'$'+Math.round(n/1e3)+'K';
return usd.format(n);
}
function fmtPct(n){
if(n==null||!isFinite(n))return'n/a';
return(n>0?'+':'')+n.toFixed(2)+'%';
}
function fmtAge(days){
if(days==null)return'unknown';
if(days>=365)return(days/365).toFixed(1)+'y';
return Math.max(0,Math.round(days))+'d';
}
function el(tag,attrs){
var node=document.createElement(tag);
if(attrs){
Object.keys(attrs).forEach(function(k){
if(k==='class')node.className=attrs[k];
else if(k==='text')node.textContent=attrs[k];
else if(k==='html')node.innerHTML=attrs[k];
else if(k.slice(0,2)==='on')node.addEventListener(k.slice(2),attrs[k]);
else if(attrs[k]!==null&&attrs[k]!==undefined)node.setAttribute(k,attrs[k]);
});
}
for(var i=2;i<arguments.length;i++){
var child=arguments[i];
if(child==null)continue;
if(Array.isArray(child))child.forEach(function(c){if(c)node.appendChild(c);});
else if(typeof child==='string')node.appendChild(document.createTextNode(child));
else node.appendChild(child);
}
return node;
}
function eqRows(pairs){
return el('div',{class:'eq'},pairs.map(function(p){return el('div',null,el('span',{text:p[0]}),el('b',{class:'num',text:p[1]}));}));
}
function validationPanel(){
var farmRows=DATA.rows.filter(function(r){return verdictOf(r)==='FARM';});
var farmText=farmRows.length===0?NOFARM:farmRows.length+(farmRows.length===1?' row passes':' rows pass')+' every FARM gate: '+farmRows.map(function(r){return r.name;}).join(', ')+'.';
var segRows=VAL.seg.map(function(sg){return[sg[0]+' (n='+sg[1]+(sg[1]<10?', <10 families: insufficient':'')+')',sg[2].toFixed(2)+'x med'+(sg[3]?' / '+sg[3].toFixed(2)+'x P90':' / P90 suppressed (<20 obs)')+' / cov '+(sg[4]*100).toFixed(1)+'%'];});
return el('section',{class:'panel model'},
el('h2',{text:'Valuation model — B0'}),
el('p',{class:'sub',text:'Estimated market capitalization = TVL × 0.213803. Calibrated against traded-token comparables using token-family-grouped validation. B0 is retained as the transparent production baseline. The empirical error range spans ÷42.45 to ×42.45. It describes historical comparable-model errors, not a guaranteed future valuation interval. This ranking measures valuation scale, not launch probability, expected airdrop rewards or investment attractiveness. Execution eligibility is evaluated independently.'}),
el('div',{class:'fm'},'implied = round( tvl_usd x '+VAL.m0+' )'),
el('p',{class:'sub',text:'Validation: '+VAL.n+' traded protocols in '+VAL.fam+' token families (CoinGecko id), '+VAL.folds+'-fold family-grouped cross-validation, folds by '+VAL.seed+' (no fold leakage; fold-specific medians). Metrics per model are out-of-fold: MdALE = median |ln(V/Vhat)|, median factor = exp(MdALE), P90 factor = exp(nearest-rank 90th pct of |ln(V/Vhat)|), bias = median ln(V/Vhat), coverage = share inside the empirical factor exp(q90)=42.45 (same-residual coverage, not independent calibration). N0 = training-fold median market cap; B0 = TVL x training-fold median MC/TVL; M1 = robust log regression (Huber ln2, L2 0.10), tested and NOT promoted. B0 ranking is mathematically equivalent to TVL ranking apart from rounding/ties: it estimates valuation scale, not mispricing or launch probability. Traded-token comparables may not represent future token launches.'}),
eqRows([['B0 median multiple (full sample)','x'+VAL.m0.toFixed(4)],['B0 MdALE / median factor',VAL.b0[0]+' / '+VAL.b0[1]+'x'],['B0 P90 factor / bias / coverage',VAL.b0[2]+'x / '+VAL.b0[3]+' / '+(VAL.b0[4]*100).toFixed(1)+'%'],['N0 MdALE / median factor',VAL.n0[0]+' / '+VAL.n0[1]+'x'],['N0 P90 factor / bias / coverage',VAL.n0[2]+'x / '+VAL.n0[3]+' / '+(VAL.n0[4]*100).toFixed(1)+'%'],['M1 MdALE / median factor',VAL.m1[0]+' / '+VAL.m1[1]+'x'],['M1 P90 factor / bias / coverage',VAL.m1[2]+'x / '+VAL.m1[3]+' / '+(VAL.m1[4]*100).toFixed(1)+'%'],['M1 promoted?','no (P90 worse than B0)'],['Nested calibration coverage (independent)',(VAL.nest*100).toFixed(1)+'%'],['Multiple sensitivity: leave-one-family-out',VAL.sens[0]+' .. '+VAL.sens[1]],['Multiple sensitivity: family bootstrap 5-95%',VAL.sens[2]+' .. '+VAL.sens[3]],['Equal-family-weighted median','x'+VAL.m0.toFixed(4)+' (all families singletons)']].map(function(p){return[p[0],String(p[1])];})),
el('p',{class:'sub',text:'Reading: N0 beats B0 on median error but B0 has the far better tail (P90); M1 improves the median further but its P90 is worse than B0, failing the promotion policy. Sampling uncertainty in the multiple (sensitivity above) is separate from the predictive error range. Each row carries the Empirical 90% error range (implied / 42.45 to x 42.45; upper/lower width ~1,802x). One TVL multiple is a weak predictor; a radar, not a price.'}),
el('p',{class:'sub',text:'Segment errors (B0 out-of-fold; median factor / P90 / coverage at the empirical factor):'}),
eqRows(segRows),
el('p',{class:'sub',text:gateText()}),
el('p',{class:'sub',text:farmText})
);
}
function integrityPanel(){
var ig=DATA.integrity;
var recon=ig.raw_count===ig.ranked_count+ig.excluded_traded+ig.excluded_by_rule+ig.excluded_invalid+ig.unclassified;
var liveCount=0,tokLive=0,tokNone=0,tokUnk=0;
for(var i=0;i<SLUGS.length;i++){var mm2=mechAt(i);liveCount+=mm2.flags&1;if(mm2.token===1)tokLive++;else if(mm2.token===2)tokUnk++;else tokNone++;}
var ev=[Object.keys(SRC).length,0,0];
for(var k in FARM_PLANS){var m=FARM_PLANS[k].join(' ').match(/\[[A-Z]+\]/g);if(m){ev[1]++;m.forEach(function(x){if(SRC[x.slice(1,-1)])ev[2]++;});}}
var proofCount=0;
for(var pk in PROOFS)proofCount+=PROOFS[pk].length;
return el('section',{class:'panel model'},
el('h2',{text:'Integrity: snapshot reconciles'}),
el('p',{class:'sub',text:'Each of the '+ig.raw_count+' snapshot records gets one disposition. Watchlist coverage '+ig.watchlist_covered+' / '+ig.watchlist_total+'; duplicate slugs: snapshot '+ig.snapshot_duplicate_slugs+', board '+ig.board_duplicate_slugs+'.'}),
eqRows([['Snapshot records','raw_count'],['Ranked on the board','ranked_count'],['Excluded: already trades','excluded_traded'],['Excluded: watchlist rule','excluded_by_rule'],['Excluded: invalid TVL','excluded_invalid'],['Unclassified','unclassified']].map(function(p){return[p[0],String(ig[p[1]])];}).concat([
['Reconciliation',recon?ig.raw_count+' = '+(ig.ranked_count+ig.excluded_traded+ig.excluded_by_rule+ig.excluded_invalid+ig.unclassified):'MISMATCH'],
['Snapshot token status (traded / no token recorded / unknown)',ig.traded_records+' / '+ig.no_token_recorded+' / '+ig.unknown_token_status],
['Board token status (live / no token recorded / unknown)',tokLive+' / '+tokNone+' / '+tokUnk],
['Evidence embedded',ev[0]+' source locators · '+ev[1]+' referenced plans · '+ev[2]+' claim-reference occurrences · '+proofCount+' exclusion proofs']
])),
el('p',{class:'sub',text:factText(liveCount,ig)})
);
}
function mechanismPanel(){
var counts=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var unkMech=0,unkMin=0,unkExit=0;
for(var i=0;i<SLUGS.length;i++){
var mm=mechAt(i);
counts[mm.mech]++;
if(mm.mech===0)unkMech++;
if(mm.min===0)unkMin++;
if(mm.exit<0)unkExit++;
}
var parts=[];
for(var m=0;m<16;m++)if(counts[m])parts.push('M'+(m<10?'0':'')+m+' '+MECH_NAMES[m]+' '+counts[m]);
var gateC=[[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],distP=[0,0,0,0,0,0,0],rtC=[0,0,0,0,0],exB=[0,0,0,0],bott={};
for(var j=0;j<SLUGS.length;j++){
var dj=discovery(j),ej=evalOf(j),xj=inputAt(j);
ej.gates.forEach(function(gv,gi){gateC[gi][gv===1?0:gv===0?1:2]++;});
if(dj.v==='UNVERIFIED'){distP[dj.p]++;ej.blockers.forEach(function(b){bott[b]=(bott[b]||0)+1;});}
rtC[xj.rewardType]++;
exB[ej.exitTotal===null?3:ej.exitTotal<=7?0:ej.exitTotal<=30?1:2]++;
}
var bottTop=Object.keys(bott).sort(function(a,b){return bott[b]-bott[a]||(a<b?-1:1);}).slice(0,8).map(function(b){return b+' '+bott[b];}).join(' · ');
return el('section',{class:'panel model'},
el('h2',{text:MECH_H}),
el('p',{class:'sub',text:'All '+SLUGS.length+' rows carry MECH parameters ('+(MECH_T.length/SLUGS.length)+' chars/row) and a decision route record. By family: '+parts.join(' · ')+'.'}),
el('p',{class:'sub',text:'Gate readiness (PASS/FAIL/UNKNOWN): '+gateC.map(function(c,gi){return'G'+(gi+1)+' '+c[0]+'/'+c[1]+'/'+c[2];}).join(' · ')+'. Distance from FARM among UNVERIFIED (gates passed): '+distP.map(function(c,p){return p+'/6: '+c;}).filter(function(s,p){return distP[p]>0;}).join(' · ')+'.'}),
el('p',{class:'sub',text:'Reward mechanisms: monetary floor '+rtC[4]+' · monetary variable '+rtC[3]+' · points '+rtC[1]+' · none documented '+rtC[2]+' · unknown '+rtC[0]+'. Complete-exit bounds: 0-7d '+exB[0]+' · 8-30d '+exB[1]+' · over 30d '+exB[2]+' · unbounded '+exB[3]+'. UNVERIFIED bottlenecks: '+bottTop+'.'}),
el('p',{class:'sub',text:'Codes: mech 0 = no mechanism family; min 0 = minimum not a verified USD figure; exit -1 = no verified bounded exit. Counts: mech 0: '+unkMech+', min 0: '+unkMin+', exit -1: '+unkExit+'. Parameters, not facts: 34 of 1,584 fact fields UNVERIFIED; WEAK facts never set table values.'}),
el('p',{class:'sub',text:'Decision routes follow the mechanism family (vaults: verify/deposit/monitor/redeem; lending/CDP: supply or open, monitor, exit; DEX/perps: position, close; RWA/stablecoin: mint/buy, redeem), parameterized per row by verified product, asset, minimum and exit. An unverified product means a verification plan, never a deposit instruction. Verdicts are computed from these parameters by the six-gate evaluator.'})
);
}
function discoveryPanel(){
var all=discoveryAll();
var farms=all.filter(function(d){return d.v==='FARM';}).length;
var four=all.filter(function(d){return d.p===4;}).length;
var fourClean=all.filter(function(d){return d.p===4&&d.f===0;}).length;
var tierC=['A','B','C','X'].map(function(t){return all.filter(function(d){return d.t===t;}).length;});
var short=all.filter(function(d){return d.t==='A'||d.t==='B';}).slice(0,8);
var marks=function(g){return g.map(function(v,gi){return'G'+(gi+1)+' '+(v===1?'✓':v===0?'✗':'?');}).join(' ');};
return el('section',{class:'panel model'},
el('h2',{text:'Monetary execution discovery — research queue'}),
el('p',{class:'sub',text:DISC_LEDE}),
eqRows([['Executable farms',String(farms)],['Four gates passed',String(four)],['Four passed, none failed',String(fourClean)],['Tier A / B / C / excluded',tierC.join(' / ')]]),
el('p',{class:'sub',text:'Priority research opportunities — verification only, no deposits recommended. Tier A: no failed gates, documented monetary reward. Tier B: no failed gates, reward unverified. Ranked by gates passed, then valuation rank.'}),
el('ol',{class:'steps'},short.map(function(d){
var r=DATA.rows.filter(function(x){return x.slug===SLUGS[d.i];})[0];
var ev=evalOf(d.i);
return el('li',null,el('b',{text:'#'+(d.i+1)+' '+(r?r.name:SLUGS[d.i])+' — '+d.p+'/6 · '+marks(ev.gates)+' · Tier '+d.t}),el('span',{class:'cost',text:'Verify: '+verifyTasks(ev.blockers)+'. Cost ceiling: $'+(POL.f*inputAt(d.i).capital).toFixed(2)+'.'}));
}))
);
}
function readHash(){
var hash=window.location.hash.replace(/^#/,'');
if(!hash)return;
var params=new URLSearchParams(hash);
if(params.get('q'))state.q=params.get('q');
if(params.get('p'))state.selected=params.get('p');
if(params.get('category'))state.category=params.get('category');
if(params.get('chain'))state.chain=params.get('chain');
}
function writeHash(){
var params=new URLSearchParams();
if(state.q)params.set('q',state.q);
if(state.category!=='all')params.set('category',state.category);
if(state.chain!=='all')params.set('chain',state.chain);
if(state.selected)params.set('p',state.selected);
var next=params.toString();
if(next)window.history.replaceState(null,'','#'+next);
else window.history.replaceState(null,'',window.location.pathname+window.location.search);
}
function rows(){
var q=state.q.trim().toLowerCase();
return DATA.rows.map(function(r){return{r:r,v:r.implied_value_usd};}).filter(function(x){
var r=x.r;
if(state.category!=='all'&&r.category!==state.category)return false;
if(state.chain!=='all'&&(r.chains||[]).indexOf(state.chain)<0)return false;
if(!q)return true;
var hay=[r.name,r.slug,r.category,(r.chains||[]).join(' ')].join(' ').toLowerCase();
return hay.indexOf(q)>=0;
});
}
function sortedRows(list){
var key=state.sort;
function val(x){
if(key==='name')return x.r.name.toLowerCase();
if(key==='tvl')return x.r.tvl_usd;
if(key==='growth')return x.r.change_7d===null?-Infinity:x.r.change_7d;
if(key==='age')return x.r.age_days===null?Infinity:x.r.age_days;
return x.v;
}
return list.slice().sort(function(a,b){
var av=val(a),bv=val(b);
if(av<bv)return-state.dir;
if(av>bv)return state.dir;
return a.r.slug<b.r.slug?-1:a.r.slug>b.r.slug?1:0;
});
}
function header(){
return el('header',{class:'top'},
el('div',{class:'brand'},el('span',{class:'mark'}),el('span',{class:'bn',text:'Token Radar'})),
el('div',{class:'tm'},
el('span',{text:'Snapshot '+DATA.as_of}),
el('span',{text:DATA.model_version+' model'})
)
);
}
function lede(){
var top=DATA.rows.slice(0,10);
var max=top.length?top[0].implied_value_usd:1;
var vc={};
DATA.rows.forEach(function(r){vc[verdictOf(r)]=(vc[verdictOf(r)]||0)+1;});
return el('section',{class:'lede'},
el('div',null,
el('h1',{text:'Token Launch Radar — valuation and executable opportunities'}),
el('p',{text:LEDE_INTRO}),
el('p',{class:'sub',text:coverageText()}),
el('div',{class:'top10'},
el('h2',{text:'Top 10 by implied value'}),
top.map(function(r){
return el('div',{class:'t1r'},
el('span',{class:'t1k num',text:String(r.rank)}),
el('span',{class:'t1n',text:r.name}),
el('span',{class:'bar t1b','aria-hidden':'true'},el('i',{style:'width:'+Math.max(3,Math.round((r.implied_value_usd/max)*100))+'%'})),
el('span',{class:'t1v num',text:fmtUsd(r.implied_value_usd)})
);
})
)
),
el('div',{class:'facts'},[
['Watchlist covered',DATA.integrity.watchlist_covered+' / '+DATA.integrity.watchlist_total],
['Ranked protocols',DATA.board_size],
['Early rows below the floor',DATA.early_size],
['Live-token protocols set aside',DATA.live_size],
['FARM / CONDITIONAL',(vc.FARM||0)+' / '+(vc.CONDITIONAL||0)]
].map(function(f){return el('div',{class:'fact'},el('span',{text:f[0]}),el('b',{text:String(f[1])}));}))
);
}
function ct(){
var categories=Array.from(new Set(DATA.rows.map(function(r){return r.category||'Other';}))).sort();
var chains=Array.from(new Set(DATA.rows.reduce(function(a,r){return a.concat(r.chains||[]);},[]))).sort();
var search=el('input',{type:'search',id:'q',placeholder:'Search',value:state.q,'aria-label':'Search the board'});
search.addEventListener('input',function(){state.q=search.value;writeHash();render();});
function sel(id,label,all,opts,cur,fn){
var s2=el('select',{id:id,'aria-label':label},el('option',{value:'all',text:all}),opts.map(function(c){return el('option',{value:c,text:c,selected:c===cur?'selected':null});}));
s2.addEventListener('change',function(){fn(s2.value);writeHash();render();});
return s2;
}
var select=sel('category','Filter by category','All categories',categories,state.category,function(v){state.category=v;});
var chainSel=sel('chain','Filter by chain','All chains',chains,state.chain,function(v){state.chain=v;});
var pre=el('button',{type:'button','aria-pressed':state.tab==='pre-token'?'true':'false',text:'Ranked board',onclick:function(){state.tab='pre-token';render();}});
var live=el('button',{type:'button','aria-pressed':state.tab==='live'?'true':'false',text:'Live token',onclick:function(){state.tab='live';render();}});
return el('div',{class:'ct'},
el('div',{class:'field'},el('label',{for:'q',text:'Search'}),search),
el('div',{class:'field'},el('label',{for:'category',text:'Category'}),select),
el('div',{class:'field'},el('label',{for:'chain',text:'Chain'}),chainSel),
el('div',{class:'field'},el('span',{class:'sub',text:'Token status'}),el('div',{class:'tabs'},pre,live)),
el('span',{class:'count',text:state.tab==='pre-token'?rows().length+' rows shown':DATA.live.length+' live-token protocols'})
);
}
function sortHeader(key,label){
return el('th',{scope:'col'},el('button',{type:'button',onclick:function(){if(state.sort===key)state.dir=-state.dir;else{state.sort=key;state.dir=-1;}render();}},label,state.sort===key?el('span',{'aria-hidden':'true',text:state.dir<0?' v':' ^'}):null));
}
function nameCell(r){
return el('td',null,el('div',{class:'name'},el('b',{text:r.name}),el('span',{class:'sub',text:(r.category||'Other')+' on '+(r.chains&&r.chains.length?r.chains.slice(0,2).join(', '):'an unnamed chain')})));
}
function boardTable(){
var list=sortedRows(rows());
if(list.length===0){
return el('div',{class:'panel'},el('div',{class:'empty'},
el('h2',{text:'No matches'}),
el('p',{text:'Clear the search or pick another category.'}),
el('button',{class:'button primary',type:'button',text:'Clear filters',onclick:function(){state.q='';state.category='all';state.chain='all';writeHash();render();}})
));
}
var max=list[0].v||1;
var tbody=el('tbody');
list.forEach(function(x){
var r=x.r;
var growth=r.change_7d===null?'n/a':fmtPct(r.change_7d);
var growthClass=r.change_7d===null?'':r.change_7d>=0?'pos':'neg';
var vd=verdictOf(r);
var tr=el('tr',{
'data-selected':state.selected===r.slug?'true':'false',
tabindex:'0',
onclick:function(){openDetail(r.slug);},
onkeydown:function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openDetail(r.slug);}}
},
el('td',{class:'num',text:String(r.rank)}),
nameCell(r),
el('td',{class:'num',text:fmtUsd(r.tvl_usd)}),
el('td',{class:'num '+growthClass,text:growth}),
el('td',{class:'num',text:fmtAge(r.age_days)}),
el('td',null,el('div',{class:'implied'},
el('div',{class:'bar','aria-hidden':'true'},el('i',{style:'width:'+Math.max(3,Math.round((x.v/max)*100))+'%'})),
el('span',{class:'num',text:fmtUsd(x.v)})
)),
el('td',null,el('span',{class:'badge v-'+vd.toLowerCase(),text:vd})),
el('td',null,el('span',{class:'status',text:tokenLabel(r)}))
);
tbody.appendChild(tr);
});
return el('div',{class:'panel'},
el('div',{class:'tw'},
el('table',null,
el('caption',{class:'sub',text:'Launch valuation leaderboard — ranked by implied value; token status is per-row evidence. Select a row for detail.'}),
el('thead',null,el('tr',null,
sortHeader('implied','Rank'),
sortHeader('name','Protocol'),
sortHeader('tvl','TVL'),
sortHeader('growth','7d'),
sortHeader('age','Age'),
sortHeader('implied','Implied value'),
el('th',{scope:'col',text:'Verdict'}),
el('th',{scope:'col',text:'Token'})
)),
tbody
)
)
);
}
function liveTable(){
var tbody=el('tbody');
DATA.live.forEach(function(r){
tbody.appendChild(el('tr',null,
el('td',{class:'num',text:'live'}),
nameCell(r),
el('td',{class:'num',text:fmtUsd(r.tvl_usd)}),
el('td',{class:'num '+(r.change_7d!==null&&r.change_7d>=0?'pos':'neg'),text:fmtPct(r.change_7d)}),
el('td',{class:'num',text:fmtUsd(r.mcap_usd)}),
el('td',null,el('span',{class:'status',text:'already trades'}))
));
});
return el('div',{class:'panel'},
el('div',{class:'tw'},
el('table',null,
el('caption',{class:'sub',text:'Already trading; market cap is a fact, not a model. Set aside from the ranking.'}),
el('thead',null,el('tr',null,el('th',{scope:'col',text:'Status'}),el('th',{scope:'col',text:'Protocol'}),el('th',{scope:'col',text:'TVL'}),el('th',{scope:'col',text:'7d'}),el('th',{scope:'col',text:'Market cap'}),el('th',{scope:'col',text:'Token'}))),
tbody
)
)
);
}
var dialog=el('dialog',{class:'detail',id:'detail','aria-labelledby':'detail-title'});
dialog.addEventListener('close',function(){state.selected=null;writeHash();});
function openDetail(slug){
var row=DATA.rows.filter(function(r){return r.slug===slug;})[0];
if(!row)return;
state.selected=slug;
writeHash();
var check=impliedOf(row);
var range=rangeOf(row.implied_value_usd);
var ri=idxOf(row.slug);
var mechName=ri>=0?MECH_NAMES[mechAt(ri).mech]:'Unknown';
var verdictText=verdictOf(row);
var ev=evalOf(ri);
var mp=ri>=0?mechAt(ri):{mech:0,min:0,exit:-1,flags:0,elig:4,risk:4,token:2,cap:100,product:false,rewardType:0,incident:0};
var inp=ri>=0?inputAt(ri):{capital:100,minCode:0,minUsd:null,exitMin:null};
var fl=[];
if(mp.flags&1)fl.push('live token');
if(mp.flags&2)fl.push('suspended');
if(mp.flags&4)fl.push('not retail');
if(mp.flags&8)fl.push('incident');
var exitText='min: '+(mp.min===1?'verified no minimum':mp.min===2?'has a minimum':'UNVERIFIED')+' · exit: '+(mp.exit<0?'UNVERIFIED':mp.exit+' days (verified)')+(inp.exitMin!==null&&inp.exitMin!==undefined?' · lock '+inp.exitMin+' days':'')+(fl.length?' · '+fl.join(', '):'');
dialog.textContent='';
var steps=routeSteps(row);
var refs=[],rm=steps.join(' ').match(/\[[A-Z]+\]/g)||[];
rm.forEach(function(x){var k=x.slice(1,-1);if(SRC[k]&&refs.indexOf(k)<0)refs.push(k);});
dialog.appendChild(el('div',{class:'dh'},
el('div',null,
el('span',{class:'bn',text:'Rank '+row.rank+' of '+DATA.board_size}),
el('h2',{id:'detail-title',text:row.name}),
el('p',{class:'sub',text:(row.category||'Other')+' on '+(row.chains&&row.chains.length?row.chains.join(', '):'an unnamed chain')})
),
el('button',{class:'close',type:'button','aria-label':'Close details',text:'Close',onclick:function(){dialog.close();}})
));
dialog.appendChild(el('section',{class:'ds'},
el('h3',{text:'Implied value (model b0)'}),
eqRows([
['TVL',fmtUsd(row.tvl_usd)],
['B0 multiple','x'+VAL.m0.toFixed(4)],
['Implied value',fmtUsd(row.implied_value_usd)],
['Empirical 90% error range',fmtUsd(range.low)+' - '+fmtUsd(range.high)],
['7d growth',fmtPct(row.change_7d)],
['Age',fmtAge(row.age_days)],
['Mechanism',mechName],
['Product',ri>=0?(prodOf(ri)||'unverified'):'unverified'],
['Deposit asset',ri>=0?(assetOf(ri)||'unverified'):'unverified'],
['Execution',exitText],
['Economic verdict',verdictText],
['FARM gates',ev.gates.map(function(g,i){return'G'+(i+1)+' '+(g===1?'PASS':g===0?'FAIL':'UNKNOWN');}).join(' · ')],
['Blockers',ev.blockers.length?ev.blockers.join(', '):'none'],
['Capital','$'+inp.capital+(inp.minCode===1?' · verified no minimum':inp.minCode===2?(inp.minUsd!==null?' · minimum $'+inp.minUsd:' · minimum amount unverified'):' · minimum unverified')],
['Cost bound',ev.costBounded?'≤ $'+ev.costUpper.toFixed(2)+' ('+(ev.costUpper/inp.capital*100).toFixed(2)+'% of capital, verified bound)':'unbounded (no verified bound; gas estimate is not one)'],
['Complete exit',ev.exitTotal!==null?ev.exitTotal+' days (verified bound)'+(inp.exitMin?'; mandatory lock '+inp.exitMin+' days':''):'unbounded (no verified bound)'+(inp.exitMin?'; mandatory lock '+inp.exitMin+' days':'')]
]),
el('p',{class:'sub',text:'Model b0 scores every protocol with one function. This row recomputes as '+fmtUsd(check)+(check===row.implied_value_usd?', matching board.json.':', differing from board.json; see validation panel.')+' The Empirical 90% error range is from held-out residuals (median '+VAL.b0[1]+'x, 90th pct '+VAL.b0[2]+'x): an estimate, not a price.'}),
el('p',{class:'sub',text:'Economics: eligibility '+['E0','E1','E2','E3','EU'][mp.elig]+', risk '+['','R1','R2','R3','RU','RS'][mp.risk]+'. Verdict '+verdictText+(verdictText==='FARM'?': passes every FARM gate, including positive conservative net return over the stated holding period; see plan conditions.':verdictText==='UNVERIFIED'?': a needed fact is unverified; no farm recommended.':verdictText==='SKIP'?': proven hard exclusion ('+ev.blockers.filter(function(b){return b.slice(-1)==='!'||b==='R3';}).join(', ')+'); no farm recommended.':verdictText==='SUSPENDED'?': do not deposit.':': Documented route; one or more FARM gates fail. Proceed only if the stated conditions are satisfied.')}),
ri>=0&&verdictText!=='FARM'?el('p',{class:'sub',text:'What must change: '+remediation(ri).join(' ')}):null
));
dialog.appendChild(el('section',{class:'ds'},
el('h3',{text:verdictText==='FARM'?'Decision route':'Decision route — hypothetical (not an approved farm)'}),
verdictText!=='FARM'?el('p',{class:'sub',text:'Blocked: verdict '+verdictText+' — blocking reasons: '+(ev.blockers.length?ev.blockers.join(', '):'none')+'. Not authorized until every FARM gate passes.'}):null,
el('ol',{class:'steps'},steps.map(function(s){
var at=s.indexOf(' Cost: ');
var action=at>=0?s.slice(0,at):s;
var tail=at>=0?s.slice(at+1):'';
return el('li',null,el('b',{text:action}),el('span',{class:'cost',text:tail}));
})),
refs.length?el('p',{class:'sub',text:'Sources (snapshot '+DATA.as_of+'): '+refs.map(function(k){return'['+k+'] '+SRC[k];}).join(' · ')}):null,
PROOFS[ri+1]?el('p',{class:'sub',text:'Exclusion evidence: '+PROOFS[ri+1].map(function(pr){return pr[0]+' ['+pr[1]+'] '+SRC[pr[1]];}).join(' · ')}):null
));
if(typeof dialog.showModal==='function'){
if(!dialog.open)dialog.showModal();
}else{
dialog.setAttribute('open','');
}
}
function render(){
app.textContent='';
var shell=el('div',{class:'shell'});
shell.appendChild(header());
shell.appendChild(lede());
if(state.tab==='pre-token')shell.appendChild(discoveryPanel());
shell.appendChild(ct());
shell.appendChild(state.tab==='pre-token'?boardTable():liveTable());
if(state.tab==='pre-token'){shell.appendChild(validationPanel());shell.appendChild(integrityPanel());shell.appendChild(mechanismPanel());}
app.appendChild(shell);
app.setAttribute('aria-busy','false');
if(!dialog.isConnected)app.appendChild(dialog);
if(state.selected)openDetail(state.selected);
}
readHash();
render();
window.addEventListener('keydown',function(e){
if(e.key==='Escape'&&dialog.open)dialog.close();
});
})();
