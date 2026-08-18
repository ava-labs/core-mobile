# Core Mobile Wallet — Transaction Flows

Companion text for `diagrams/Wallet-transaction-flows.drawio`. One section per diagram page,
each answering:

- **(i)** the parties involved
- **(ii)** the flow of funds (fiat currency, stablecoins, and other digital assets)
- **(iii)** custody and key control
- **(iv)** third-party providers
- **(v)** fees

> **Note on the item headings.** The source questionnaire referred to items (i)–(v) but the list
> itself was not supplied. The five headings above were agreed as the working interpretation. If
> the verbatim list differs, the content below is organised so it can be re-mapped without
> redrawing the diagrams.

## Scope and known gaps

Documented here: **Onboarding, Receive, Send, Buy (fiat on-ramp), Swap, Stake/Earn, Recurring swap,
Offramp (fiat off-ramp), dApp transaction signing** — nine flows across ten diagram pages.

Still **not** documented:

| Flow | Why it matters |
| --- | --- |
| **Bridge** | Standalone cross-chain asset movement. Partially covered by the cross-chain paths on the Swap page (deBridge, Avalanche CCT/CCIP, Lombard), but the dedicated bridge feature has its own entry points. |
| **Collectible (NFT) send** | Code: `app/new/features/collectibleSend/`. Mechanically close to the Send page but with ERC-721/1155 specifics. |

## Page index

| Page | Flow | Note |
| --- | --- | --- |
| 0 | Legend & Parties | Visual language, scope, and the cross-wallet summary |
| 1 | Onboarding | Establishing custody — no assets move |
| 2 | Receive | Inbound crypto and stablecoins |
| 3 | Send | Outbound transfer |
| 4 | Buy | Fiat to crypto (on-ramp) |
| 5 | Swap | Same-chain and cross-chain |
| 6 | Stake / Earn | P-Chain delegation — **the only Core-charged fee, on the Fast Stake path only** |
| 7 | Recurring swap | Scheduled / DCA — **no per-fill signature** |
| 8 | Offramp | Crypto to fiat — **counterparty exposure window** |
| 9 | dApp signing | In-app browser and WalletConnect |

## Conventions

Node colour identifies the acting party; edge colour identifies what moves; label prefixes mark
fee points and key usage.

| Element | Meaning |
| --- | --- |
| Blue node | User / device |
| Green node | Core Mobile app, running locally |
| Teal node | Ava Labs backend (Core proxy, Glacier, Gas Station, token aggregator, core-seedless-api) |
| Orange node | Third-party service, outside Ava Labs' control |
| Purple node | Blockchain network |
| Red node | Private-key material |
| Green dashed edge | Fiat currency |
| Orange solid edge | Crypto asset |
| Grey thin edge | Data / control — carries no value |
| Red dashed edge | Key material or a signature |
| Dashed **red** band | **Key control boundary** — where key material lives and signing happens |
| Dashed **amber** band | **Core-owned fee escrow** — a fee paid to an address Ava Labs owns (Stake/Earn, Fast Stake path only) |
| Dashed **yellow** band | **Reduced user control** — the customer does not control the asset here, or no per-transaction signature is taken |
| `(f)` prefix | A fee or spread is taken at this step |
| `(k)` prefix | Private-key material is used at this step |

**Findings that hold across the whole wallet:**

1. **Core never holds customer fiat.** No flow routes fiat through an Ava Labs or Core-controlled
   account. On both the on-ramp and the off-ramp, fiat stays inside the licensed provider's
   environment.
2. **Core never takes custody of customer crypto.** Assets settle to addresses the customer
   controls, and Ava Labs cannot sign on their behalf — except that for **seedless wallets** the
   key material itself sits in CubeSigner's HSM (see Onboarding).
3. **Continuous user control has four qualifications**, each documented on its own page:
   - **Cross-chain swap** — a third-party bridge contract holds the asset between legs.
   - **Offramp** — the customer's crypto must reach a provider-controlled address *before* the
     fiat payout arrives. A genuine counterparty exposure with no equivalent in Buy.
   - **Recurring swap** — a standing on-chain allowance lets Markr execute later orders with **no
     contemporaneous user signature**.
   - **Stake/Earn** — the stake is locked by the protocol for the full term and cannot be
     withdrawn early.
4. **Core charges an explicit fee in one place only: the Fast Stake path of Stake/Earn.** A
   convenience fee is paid to a **Core-owned P-Chain escrow address**, at a rate delivered as a
   PostHog flag variant. The **advanced delegate path charges no Core fee** — a separate delegate-fee
   flag and escrow address exist in the code but are not enabled. Send, Receive, Buy, Offramp, Swap
   and dApp signing apply no Core service fee in the client code — though for Buy, Offramp and Swap
   there are third-party partner-fee mechanisms whose commercial terms are not visible in the client
   (see the final section).
5. **Every dApp transaction requires explicit approval.** The Quick Swaps auto-approve bypass is
   gated on `isInAppRequest` and a software wallet type, so it is structurally unreachable from a
   dApp or WalletConnect request.

## 1. Onboarding — establishing custody

No assets move. This flow decides who holds the keys for every later transaction, so it is the
reference for item (iii) everywhere else. Four wallet types are offered, with materially different
custody consequences.

The user accepts the Terms of Use, picks a wallet type, then converges on a shared tail: wallet
name and avatar, a 6-digit PIN, optional biometric unlock, an analytics consent choice, and
address derivation for every supported chain via `ModuleManager` (BIP-44).

| Wallet type | Where the keys live | Who can sign |
| --- | --- | --- |
| **A. Recovery phrase** (create or import) | 24-word BIP-39 mnemonic generated on device, encrypted in the device keychain under a PIN-derived key | User only. Ava Labs cannot sign, freeze, or recover. |
| **B. Seedless** (Google / Apple sign-in) | **CubeSigner (Cubist Labs) HSM — not on the handset** | Signing is **remote** and MFA-gated. The user authorises each signature but does not hold the key. |
| **C. Ledger** | Ledger hardware device | User only; each signature needs physical confirmation. |
| **D. Keystone** | Keystone device, air-gapped | User only; signatures exchanged as QR codes. |

- **(i) Parties** — user; Core Mobile app; Ava Labs backend (terms document, `core-seedless-api`);
  third parties (Google / Apple OIDC, CubeSigner, PostHog). No blockchain interaction.
- **(ii) Flow of funds** — none. No fiat, stablecoin, or other digital asset moves.
- **(iii) Custody** — four models, per the table. **Only the seedless model places key material
  with a third party**, and it is the one case where signing capability does not rest solely with
  the customer's own hardware.
- **(iv) Third parties** — Google / Apple (identity assertion only, no key access); CubeSigner
  (key generation, storage, and remote signing); PostHog (analytics and feature flags, only with
  consent).
- **(v) Fees** — none. No network transaction is involved.

Code: `app/new/features/onboarding/`, `app/services/wallet/WalletFactory.ts`, `app/seedless/`.

## 2. Receive — inbound crypto and stablecoins

The wallet publishes an address and waits. It selects a network, looks up the address derived at
onboarding, and renders it as a QR code and text. The sender then constructs and signs their own
transaction. Once settled, Glacier indexes it, a push notification fires, and balances update.

- **(i) Parties** — user; Core Mobile app; Ava Labs backend (Glacier indexer, push
  notifications); the external sender; the blockchain network.
- **(ii) Flow of funds** — one direction only, from the sender's address to an address the user
  controls. Identical for native coins, stablecoins (e.g. USDC), other ERC-20s, and NFTs. No fiat.
  The asset never passes through an Ava Labs account.
- **(iii) Custody** — non-custodial, and **no private key is used at all**: receiving requires only
  the public address. Core cannot refuse, reverse, or intercept an inbound transfer.
- **(iv) Third parties** — Glacier is Ava Labs' own indexer reading public chain data; Firebase
  delivers the notification. Neither can move funds.
- **(v) Fees** — Core charges nothing. The **sender** pays the network fee; the recipient pays
  nothing on any supported chain.

Code: `app/new/features/receive/`.

## 3. Send — outbound transfer of crypto and stablecoins

Five chain-specific paths (EVM, Bitcoin UTXO, X-Chain, P-Chain, Solana) share one approval and
signing pipeline. After the user picks an asset, recipient, and amount, the app validates address
format, balance, fee affordability, and chain-specific minimums (Bitcoin dust, Solana rent), builds
the transaction for the target VM, and routes it through an in-app RPC request to the
`ApprovalController`. Blockaid screens it. The user approves with PIN or biometrics, `WalletService`
signs via the wallet's key source, and the VM module broadcasts.

- **(i) Parties** — user; Core Mobile app; Ava Labs backend (fee and price data, Gas Station,
  Glacier); third parties (Blockaid; Ledger / Keystone / CubeSigner as signers); the blockchain
  network; the recipient.
- **(ii) Flow of funds** — one direction, from an address the user controls to the recipient's
  address, settled on-chain. Native coins, stablecoins, other ERC-20s, and NFTs all follow this
  path. No fiat. **The asset is never held by Ava Labs at any point.**
- **(iii) Custody** — non-custodial. Signing happens inside the key control boundary: on device for
  recovery-phrase wallets, on the hardware device for Ledger and Keystone, and remotely in
  CubeSigner's HSM for seedless wallets. Core cannot produce a valid transfer without the user's
  approval.
- **(iv) Third parties** — Blockaid receives transaction details for risk screening and can only
  **warn**, never block or alter. Hardware and remote signers receive the payload to be signed.
- **(v) Fees** — the **network fee (gas) is the only mandatory cost**, paid to validators or
  miners, not to Ava Labs. No Core service fee is applied to a send in the client code. Where the
  Ava Labs Gas Station sponsors gas so a user can transact without a native balance, Ava Labs
  bears that cost rather than charging the user.

Code: `app/new/common/hooks/send/`, `app/new/features/send/`, `app/services/wallet/WalletService.tsx`,
`app/services/gasless/GaslessService.ts`.

## 4. Buy — fiat currency to crypto (on-ramp)

Two implementations. **Path A (primary)** uses the **Meld** aggregator; **path B** is a legacy
direct-provider screen used when the Meld on-ramp feature flag is off.

**Path A.** The user selects country and fiat currency, the asset to buy, and an amount. Every Meld
call is forwarded by the Core proxy (`PROXY_URL/proxy/meld`) — **the app never calls Meld
directly**. Meld returns trade limits, payment methods, providers, and quotes. The user picks a
provider; `createSessionWidget` sends Meld the wallet address, amount, currencies, and redirect
URL, and returns a hosted widget URL. **KYC and payment collection happen entirely inside the
provider's own environment.** The provider settles the fiat leg with the card network or bank and
sends the purchased asset on-chain directly to the user's wallet address. A Meld webhook records
the transaction, which the app polls via `fetchTransactionBySessionId`.

**Path B.** The legacy screen lists Moonpay (signed widget URL built by the Core proxy), Coinbase
Pay (URL built on device by the `cbpay-js` SDK, no proxy), and Halliday (the `core.app` bridge page
in a web view). Each shows an interstitial naming the partner and its terms before opening.
Settlement follows the same provider-to-user pattern.

- **(i) Parties** — user; Core Mobile app; Ava Labs backend (the Core proxy, which brokers all
  Meld traffic and signs Moonpay URLs); Meld as aggregator; the licensed payment service provider
  that actually sells the asset; the user's card issuer or bank; the blockchain network.
- **(ii) Flow of funds** — **two legs that never meet inside Core.** The **fiat** leg runs from the
  user's card or bank account to the provider and stays entirely within the provider's regulated
  environment; **no fiat enters an Ava Labs or Core-controlled account.** The **crypto** leg runs
  from the provider on-chain directly to the user's own wallet address. Purchasable assets include
  native coins (AVAX) and stablecoins (USDC on C-Chain).
- **(iii) Custody** — non-custodial for both legs. Core never holds customer fiat and never takes
  possession of the purchased crypto; settlement is provider-to-user. The app supplies only the
  destination address it derived at onboarding. **No private key is used anywhere in this flow.**
- **(iv) Third parties** — Meld (aggregation, quoting, session creation, webhook reconciliation)
  receives the wallet address, amount, and currency pair. The selected provider additionally
  receives full **KYC identity and payment credentials**, collected in its own hosted widget;
  **those credentials are never seen by the app.** **KYC and sanctions screening are performed by
  the provider, not by Core.** Legacy path: Moonpay, Coinbase Pay, Halliday.
- **(v) Fees** — the provider's fee and FX spread, shown in the quote before the user commits; any
  card or bank charge levied by the user's own issuer; and the network fee for on-chain delivery,
  normally absorbed into the provider's quote. **Whether Ava Labs receives a referral or revenue
  share from Meld or the providers is a commercial arrangement that is not observable in the client
  code and must be confirmed from the contracts.**

Code: `app/new/features/meld/` (path A), `app/new/features/buy/screens/BuyScreen.tsx` (path B).

## 5. Swap — crypto to crypto, same-chain and cross-chain

Routed by the Fusion SDK across several independent venues, each toggled by feature flag:
**Markr** (DEX aggregation on EVM and Solana, carrying a Core partner identifier), **deBridge**
(cross-chain routing), **Avalanche CCT / CCIP** (cross-chain transfer of supported tokens),
**Lombard** (BTC ↔ BTC.b), and an always-enabled wrap/unwrap service.

Quotes stream from every enabled venue in parallel. The app ranks them and computes price impact,
the slippage limit, and total fees. If the source asset is an ERC-20, a spending allowance may be
needed — a separate on-chain approval. Blockaid screens the payload, the user approves, and
`transferAsset` signs through the EVM, Bitcoin, or Solana signer. `trackTransfer` then polls status
(pending, completed, failed, refunded), with stuck-funds detection offering a recovery path if a
cross-chain leg does not complete.

- **(i) Parties** — user; Core Mobile app; Ava Labs backend (token-aggregator price API, Core
  proxy); third-party venues (Markr, deBridge, Avalanche CCT/CCIP, Lombard, and the underlying DEX
  liquidity pools); Blockaid; one or two blockchain networks.
- **(ii) Flow of funds** — crypto only; **no fiat at any point.** *Same-chain:* the asset leaves the
  user's address, passes through a DEX router, and the output returns to the same user address in a
  single settled transaction. *Cross-chain:* the asset is locked or burned on the source chain, the
  bridge holds or mints against it, and the destination asset is delivered to the user's address on
  the target chain. Stablecoins are among the most commonly swapped assets and follow the same path
  as any other token.
- **(iii) Custody** — non-custodial, **with one qualification that matters.** Signing stays inside
  the key control boundary and Ava Labs never holds the asset. However, during a **cross-chain**
  swap the asset is held by a third-party bridge or router contract between the source and
  destination legs: the user does not control it during that window, and completion depends on the
  bridge. The app detects non-completion and offers a recovery path. **Same-chain swaps have no
  such window.**
- **(iv) Third parties** — Markr, deBridge, Avalanche CCT/CCIP, Lombard, and Blockaid
  (pre-signature risk screening). Each venue is independently toggleable by feature flag. **None
  receives customer identity data** — only addresses and amounts.
- **(v) Fees**, in the order taken:
  1. source-chain network fee;
  2. DEX liquidity-provider fee, plus the price impact of the trade against available liquidity,
     bounded by the user's slippage setting;
  3. the aggregator's fee, attributed to Core via the Markr partner identifier;
  4. for cross-chain routes, an additive **bridge fee** — charged either in the source token
     (deBridge) or in the native asset (CCIP), and disclosed before approval;
  5. a destination-chain network fee where the route requires a second transaction.

  The app shows a consolidated breakdown before the user approves. **Whether the Markr partner
  identifier produces revenue for Ava Labs is a commercial arrangement not observable in the client
  code and must be confirmed from the contracts.**

Code: `app/new/features/swap/`, `app/new/features/swap/services/FusionService.ts`.

## 6. Stake / Earn — P-Chain delegation

Delegation requires AVAX on the **P-Chain**, so funding it from the C-Chain adds two atomic
cross-chain transactions before the stake itself. `computeDelegationSteps` decides which are needed:
with enough P-Chain balance it delegates directly, otherwise it runs `exportC` → `importP` →
`delegate`. **Claiming at the end of the term adds two more** (`exportP` → `importC`).

**Every transaction in this flow is signed separately.** `claimRewards` calls `exportP` and
`importC`, and each invokes `WalletService.sign` independently — so claiming takes **two distinct
signatures**, not one, with `useLedgerClaimReward` driving a per-step confirmation on hardware
wallets. `importAnyStuckFunds` recovers AVAX left mid-transfer if a step was interrupted.

Validator selection has two modes, and they differ on fees:

| Path | Validator selection | Core fee |
| --- | --- | --- |
| **Fast Stake** | Auto-selected via Glacier: uptime ≥ 98%, delegation fee ≤ 2%, spare capacity, enough time left to cover the duration | **Yes** — convenience fee to a Core-owned P-Chain escrow |
| **Advanced delegate** | User browses and filters nodes, picks one | **No** |

- **(i) Parties** — user; Core Mobile app; Ava Labs backend (Glacier validator data, PostHog
  fee-rate flag); the validator node operator; **a Core-owned P-Chain escrow address (Fast Stake
  only)**; the Avalanche C-Chain and P-Chain.
- **(ii) Flow of funds** — AVAX only, no fiat. Up to three transactions to fund and delegate, the
  stake locked for its term, then two more to bring stake and rewards back. Every leg stays between
  addresses the user controls, except the Fast Stake convenience-fee output.
- **(iii) Custody** — non-custodial, with two points worth stating. First, the staked AVAX is locked
  by the **Avalanche protocol itself**; neither Core nor the validator can spend, seize, or redirect
  it, and the validator never takes possession — but the funds are **illiquid for the full term**
  and cannot be withdrawn early. Second, **every transaction here is separately signed by the
  user**: up to three signatures to fund and delegate, and **two more to claim**. Hardware wallets
  require a physical confirmation for each. Because the flow spans several transactions, an
  interrupted run can leave AVAX in an atomic-transfer state — hence the recovery path.
- **(iv) Third parties** — the validator node operator (earns and shares rewards, takes its own
  commission); Glacier supplies the metrics behind Fast Stake auto-selection. Neither receives
  customer identity data.
- **(v) Fees** — in order:
  1. C-Chain atomic transaction fee on `exportC`;
  2. P-Chain fee on `importP`;
  3. P-Chain delegation transaction fee;
  4. the **validator's** delegation fee (commission), deducted from rewards earned;
  5. two further network fees when claiming (`exportP` and `importC`);
  6. **on the Fast Stake path only**, a **Core convenience fee** paid to a Core-owned P-Chain escrow
     address as a UTXO output bundled with the delegation transaction.

  The rate arrives as a **PostHog multivariate flag variant in basis points** and is applied to the
  **net** estimated reward, after the validator's own fee; no variant configured means no fee. The
  reward figure shown to the user is net of this fee before they commit.

  **The advanced delegate path charges no Core fee.** The client does contain a separate
  `delegation-fee-enabled` flag and a distinct delegate escrow address, so the capability exists in
  code but is **dormant**. Confirm its status before relying on this in a filing.

Code: `app/new/features/stake/`, `app/new/features/stake/v2/`, `app/services/earn/`,
`app/new/features/stake/v2/constants.ts` (escrow addresses),
`app/new/features/stake/v2/hooks/useFastStakeReviewSource.ts` and `useAdvancedReviewSource.ts`
(the two fee policies).

## 7. Recurring swap — scheduled / DCA orders

The user configures an amount per order, a frequency, and a number of orders (or **Unlimited**,
carried to Markr as a `-1` sentinel). Eligibility is checked by the SDK against Markr's chain data:
**same-chain only**, native asset or any ERC-20.

Submission runs the SDK's `executeFirstFill`, which reads the on-chain allowance against the router
it derives, signs an ERC-20 `approve` if needed (attempting a one-click batch first, falling back
to two sequential signatures), then signs and broadcasts the first fill. Every signature still
routes through the ApprovalController, so the user sees the approval modal.

**Subsequent fills are executed by Markr against the standing allowance, with no further user
signature.** Pausing, resuming, and cancelling each require a fresh signature.

- **(i) Parties** — user; Core Mobile app; Ava Labs backend (push notifications, price data);
  Markr's recurring router and its underlying DEX liquidity; one blockchain network.
- **(ii) Flow of funds** — crypto only, no fiat. Each order moves the configured amount from the
  user's own address through Markr's router and returns the bought asset to the same address.
  Between fills the assets **remain in the user's address** — they are not pre-funded or escrowed
  with Markr. Stablecoins are a common source asset.
- **(iii) Custody** — **the key point on this page.** Assets are never custodied by Core or Markr,
  and each fill settles back to the user's own address. But the first signature grants a **standing
  ERC-20 allowance** to Markr's recurring router, and every later order executes against it
  **without a contemporaneous user signature**. This is a *continuing* authorisation rather than a
  per-transaction one: ongoing user control rests on the allowance's scope and on the ability to
  cancel. Choosing "Unlimited" arms the schedule indefinitely until cancelled.
- **(iv) Third parties** — Markr operates the router, holds the allowance, and decides when each
  order executes. It receives addresses and amounts only, no identity data.
- **(v) Fees** — the same components as a single swap, incurred **once per fill**: network fee, DEX
  liquidity-provider fee plus price impact bounded by the slippage setting, and the aggregator fee
  attributed to Core via the Markr partner identifier. A schedule of N orders incurs these N times.
  The one-off `approve` transaction carries its own network fee. As with single swaps, whether the
  partner identifier yields revenue for Ava Labs is not observable in the client code.

Code: `app/new/features/recurringSwap/`, `app/new/features/recurringSwap/utils/submitRecurringSwap.ts`.

## 8. Offramp — crypto to fiat currency (sell / withdraw)

The mirror of Buy, sharing the same Meld session machinery with `sessionType: SELL` and
`redirectFlow`. The user selects a payout currency, the asset to sell, an amount, and a payout
method; the Core proxy brokers every Meld call; the provider quotes a fiat payout; and
`createSessionWidget` returns a hosted widget URL. The session id is stored so the app can poll
`fetchTransactionBySessionId`.

- **(i) Parties** — user; Core Mobile app; Ava Labs backend (the Core proxy); Meld as aggregator;
  the licensed provider that buys the asset and pays out the fiat; the user's receiving bank; the
  blockchain network.
- **(ii) Flow of funds** — the reverse of Buy, in two legs that never meet inside Core. The
  **crypto** leg runs from the user's own address on-chain to a **deposit address controlled by the
  provider**. The **fiat** leg then runs from the provider to the user's bank account or card and
  stays entirely within the provider's regulated environment — no fiat passes through an Ava Labs
  or Core-controlled account. Sellable assets include AVAX, BTC, and stablecoins (USDC).
- **(iii) Custody** — **materially different from every other flow, and worth stating plainly.**
  Core remains non-custodial and never holds either leg. But to complete a sale the customer must
  transfer their crypto to a **provider-controlled address**, and during the interval between that
  transfer and the payout they hold **neither the crypto nor the fiat**. That interval is a genuine
  counterparty exposure to the provider, and it has **no equivalent in the Buy flow**, where the
  provider delivers to the customer. Core cannot reverse the on-chain transfer or compel the payout.
- **(iv) Third parties** — Meld (aggregation, sell quoting, session creation, transaction lookup)
  receives the wallet address, amount, and currency pair. The selected provider additionally
  receives full **KYC identity and the customer's bank account or payout details**, collected in its
  own hosted widget and never seen by the app. KYC, sanctions screening, and any source-of-funds
  checks are performed by the provider, not by Core.
- **(v) Fees** — the fee structure is **explicit** here: Meld's transaction record itemises
  `networkFee`, `transactionFee`, `partnerFee`, and `totalFee`. So: a provider transaction fee, a
  partner fee, the on-chain network fee for sending the asset to the provider, and the FX spread
  embedded in the quoted payout rate. The user's own bank may also charge to receive funds. Whether
  the `partnerFee` accrues to Ava Labs is **not determinable from the client code** and must be
  confirmed from the Meld contract.

Code: `app/new/features/meld/offramp/`, `app/new/features/meld/hooks/useWithdraw.ts`,
`app/new/features/meld/hooks/useSelectAmount.tsx`.

## 9. In-app browser and WalletConnect — third-party dApp transaction signing

The widest risk surface in the wallet: the transaction is authored by an **arbitrary third party**,
not by Core.

Core injects a `window.ethereum` shim (EIP-1193 + EIP-6963) into the WebView. A dApp's
`eth_requestAccounts` crosses a `postMessage` bridge to the native RPC handler and reaches a connect
approval screen; **account addresses are disclosed only after the user authorises that specific
site** — they are never pre-seeded into the shim. Signing requests then pass a namespace filter (so
a `solana_*` or `bitcoin_*` method cannot route into the EVM signing path) before reaching the
ApprovalController.

- **(i) Parties** — user; Core Mobile app (WebView and injected shim); Ava Labs backend (Blockaid
  proxy on the WalletConnect path); the third-party dApp and, where used, the WalletConnect relay;
  the blockchain network. Any smart contract the dApp calls is a further counterparty.
- **(ii) Flow of funds** — **entirely determined by the dApp's transaction, not by Core.** It may
  move native coins, stablecoins, other tokens or NFTs, grant a spending allowance, or move nothing
  at all (a plain message signature). No fiat. Core constructs none of it; the app decodes and
  presents what the dApp asked for.
- **(iii) Custody** — non-custodial, and the **strongest per-transaction control in the wallet**.
  Signing stays inside the key control boundary and **every** dApp request reaches an explicit
  approval screen: the Quick Swaps auto-approve bypass requires `isInAppRequest` and a software
  wallet type, so it is structurally unreachable from a dApp. Approvals parked when the user
  navigates cross-origin are aborted rather than left live. The residual risk here is not custodial
  but **comprehension-based** — a user may approve a transaction whose effect they misjudge, most
  consequentially an unlimited token allowance.
- **(iv) Third parties** — the dApp is arbitrary and unvetted. Blockaid screens the dApp URL on the
  **WalletConnect** path, gated by a feature flag. **Gap to confirm:** no equivalent Blockaid site
  scan was found on the in-app **browser** path in the client code. If browser-side dApp screening
  is expected, that should be verified with engineering rather than assumed from this diagram.
- **(v) Fees** — the network fee is the only cost Core is involved in, paid to validators or miners.
  Core applies no service fee to a dApp transaction. Any additional cost — a swap fee, mint price,
  protocol fee, or spread — is set by the dApp's own contract, outside Core's control and visibility.

Code: `app/hooks/browser/evmProviderShim.ts`, `app/new/features/browser/`,
`app/vmModule/ApprovalController/`, `app/store/rpc/handlers/`.

## Points to confirm outside the codebase

These cannot be answered from the client code and need input from commercial or compliance owners:

1. Referral or revenue-share terms with **Meld** and its payment service providers (both on-ramp
   and off-ramp), and with **Moonpay / Coinbase / Halliday**. On the off-ramp, Meld's transaction
   record carries an explicit **`partnerFee`** — confirm who receives it.
2. Whether the **Markr partner identifier** produces fee revenue for Ava Labs, on single swaps and
   on recurring schedules, and on what terms.
3. The **Fast Stake convenience fee** is the one Core-charged fee actually collected. Confirm for a
   regulatory answer: the current configured rate (it arrives as a PostHog flag variant, not a
   constant in the code), which entity owns the P-Chain escrow address, how the collected fees are
   accounted for, and how the fee is disclosed to customers in-product. Separately, confirm the
   intended status of the **dormant advanced-delegate fee** (`delegation-fee-enabled` and its own
   escrow address exist in the code but are not enabled) — whether it is planned, deprecated, or
   should be removed.
4. The contractual division of responsibility with **CubeSigner (Cubist Labs)** for seedless
   wallets — key access, availability guarantees, and what happens on provider failure, given that
   key material sits outside the customer's device.
5. Which **jurisdictions** each on-ramp and off-ramp provider is licensed in, and how geographic
   restrictions are enforced. The app filters by country via Meld, but the underlying licensing
   position is the provider's.
6. **Data retention and sharing** terms for the KYC identity data collected by on-ramp providers,
   and additionally the **bank account / payout details** collected by off-ramp providers.
7. On the **off-ramp counterparty window** (customer's crypto sent to a provider-controlled address
   before payout): what contractual protection or recourse exists if a provider fails to pay out.
8. For **recurring swaps**, the scope of the standing allowance granted to Markr's router (is it
   bounded per-order or unlimited?), and what happens to an armed "Unlimited" schedule if Markr
   ceases to operate.
9. Whether **browser-side dApp screening** is expected. Blockaid scans dApp URLs on the
   WalletConnect path, but no equivalent scan was found on the in-app browser path.
