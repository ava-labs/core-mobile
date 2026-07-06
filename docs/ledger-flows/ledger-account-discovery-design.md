# Ledger Account Discovery Design

This document explains the two Ledger account discovery flows (BIP44 and LedgerLive), when each fires, and how the onboarding / import / add-account paths work end-to-end.

---

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Derivation Path Selection](#derivation-path-selection)
- [Onboarding & Import Flow](#onboarding--import-flow)
- [BIP44 Discovery (Deep Dive)](#bip44-discovery-deep-dive)
- [LedgerLive Discovery (Deep Dive)](#ledgerlive-discovery-deep-dive)
- [Add Account Flow (Post-Onboarding)](#add-account-flow-post-onboarding)
- [Balance Activity Detection](#balance-activity-detection)
- [Key Material Storage](#key-material-storage)
- [File Map](#file-map)

---

## High-Level Architecture

Both BIP44 and LedgerLive follow the same two-phase strategy:

1. **Fast import** — create account 0 on the device, store key material for indices 0–9
2. **Background discovery** — after navigation, derive addresses offline and check on-chain activity to auto-create accounts 1–9

```mermaid
flowchart TB
    subgraph Phase1["Phase 1 — Fast Import (blocking)"]
        A[User selects derivation path] --> B[Device: fetch keys for indices 0–9]
        B --> C[Create wallet with account 0]
        C --> D[Store xpubs/pubkeys for indices 1–9 in wallet secret]
        D --> E[Navigate to home screen]
    end

    subgraph Phase2["Phase 2 — Background Discovery (non-blocking)"]
        E -- "dispatch(onWalletImported) after 1.5s" --> F[Load wallet secret from secure storage]
        F --> G{BIP44 or LedgerLive?}
        G -- BIP44 --> H[Derive addresses from xpubs]
        G -- LedgerLive --> I[Derive addresses from public keys]
        H --> J[Query Balance API + C-Chain history]
        I --> J
        J --> K[Create Redux accounts for active indices]
        K --> L[Set ledger addresses for each account]
    end

    style Phase1 fill:#1a1a2e,stroke:#16213e,color:#e0e0e0
    style Phase2 fill:#0f3460,stroke:#16213e,color:#e0e0e0
```

---

## Derivation Path Selection

The user picks their derivation mode on `PathSelectionScreen`. This choice determines how keys are fetched from the device and how addresses are derived offline.

```mermaid
flowchart LR
    PS[PathSelectionScreen] --> |"BIP44 selected"| CTX["LedgerSetupContext<br/>derivationPathType = BIP44"]
    PS --> |"LedgerLive selected"| CTX2["LedgerSetupContext<br/>derivationPathType = LedgerLive"]
    CTX --> ACS[AppConnectionScreen]
    CTX2 --> ACS
```

| Property | BIP44 | LedgerLive |
|----------|-------|------------|
| Key type from device | Account-level extended public keys (xpubs) | Address-level raw public keys |
| EVM derivation | Shared xpub at `m/44'/60'/0'`, address at `0/{index}` | Per-account pubkey at `m/44'/60'/{index}'/0/0` |
| Avalanche derivation | Per-account xpub at `m/44'/9000'/{index}'` | Per-account pubkey at `m/44'/9000'/{index}'/0/0` |
| Offline address derivation | `deriveAddressesFromXpub` (BIP32 child derivation) | `deriveAddressesFromPublicKeys` (direct) |
| Stored `extendedPublicKeys` | Yes — per-index `{ evm, avalanche }` | No — omitted from wallet secret |
| Wallet type in Redux | `WalletType.LEDGER` | `WalletType.LEDGER_LIVE` |
| Offline add-account support | Yes (via stored xpubs) | No (requires device connection) |

---

## Onboarding & Import Flow

The same screen components serve both **first-time onboarding** (no existing wallet) and **import** (adding a Ledger to an existing app). The only differences are navigation targets and toast behavior.

| Route | Context |
|-------|---------|
| `routes/onboarding/ledger/appConnection` | First-time onboarding |
| `routes/(signedIn)/(modals)/accountSettings/ledger/appConnection` | Import while signed in |

Both render `AppConnectionOnboardingScreen`.

```mermaid
sequenceDiagram
    participant User
    participant PathSelection as PathSelectionScreen
    participant AppConn as AppConnectionScreen
    participant OnboardingScreen as AppConnectionOnboardingScreen
    participant Hook as useLedgerWallet
    participant Secret as buildLedgerWalletSecret
    participant Redux as Redux Store
    participant Listener as account/listeners
    participant Discovery as discoverLedgerAccountsFromXpubs
    participant BalanceAPI as Balance API

    User->>PathSelection: Choose BIP44 or LedgerLive
    PathSelection->>AppConn: derivationPath set in context

    Note over AppConn: Phase 1 — Device Key Fetch
    AppConn->>AppConn: Avalanche app: getAvalancheKeys(index 0)
    alt BIP44
        AppConn->>AppConn: getExtendedPublicKeysForRange(1, 9)
        AppConn->>AppConn: deriveAddressesFromXpub for each index
    else LedgerLive
        AppConn->>AppConn: getPublicKeysForRange(1, 9)
        AppConn->>AppConn: deriveAddressesFromPublicKeys for each
    end
    AppConn->>AppConn: Solana app: getSolanaKeysForRange(10)

    Note over OnboardingScreen: Phase 1 — Wallet Creation
    User->>OnboardingScreen: "Complete setup"
    OnboardingScreen->>OnboardingScreen: buildAdditionalData(multiIndexKeys)
    OnboardingScreen->>Hook: createLedgerWallet(account0 + additional data)
    Hook->>Secret: buildLedgerWalletSecret(NEW)
    Secret-->>Hook: JSON wallet secret
    Hook->>Redux: storeWallet + setAccount + setActiveAccountId
    OnboardingScreen->>OnboardingScreen: setLedgerAddress(account 0)
    OnboardingScreen->>OnboardingScreen: Navigate to home

    Note over Listener: Phase 2 — Background Discovery (1.5s delay)
    OnboardingScreen->>Redux: dispatch(onWalletImported)
    Redux->>Listener: onWalletImported listener fires
    Listener->>Discovery: discoverLedgerAccountsFromXpubs(walletId)
    Discovery->>Discovery: Load & parse wallet secret
    alt BIP44
        Discovery->>Discovery: discoverFromXpubs (offline derivation)
    else LedgerLive
        Discovery->>Discovery: discoverFromPublicKeys (offline derivation)
    end
    Discovery->>BalanceAPI: getActiveAccountIndices(derivedAccounts)
    BalanceAPI-->>Discovery: active indices [0, 1, 3, ...]
    Discovery->>Discovery: Fill gaps → [0, 1, 2, 3]
    Discovery-->>Listener: DiscoveredLedgerAccount[]
    Listener->>Redux: setNonActiveAccounts + setLedgerAddresses
```

---

## BIP44 Discovery (Deep Dive)

BIP44 uses **extended public keys** for efficient offline derivation. A single EVM xpub at index 0 can derive EVM addresses for all account indices.

```mermaid
flowchart TD
    subgraph Device["Device Key Fetch (AppConnectionScreen)"]
        D1["getAvalancheKeys(0)<br/>Full APDU flow for account 0"]
        D2["getExtendedPublicKeysForRange(1, 9)<br/>2 APDU per account × 9 = 18 calls"]
        D3["getSolanaKeysForRange(10)<br/>Ed25519 keys for Solana"]
        D1 --> D2 --> D3
    end

    subgraph Storage["Wallet Secret (BiometricsSDK)"]
        S1["deviceId, deviceName"]
        S2["derivationPathSpec: BIP44"]
        S3["extendedPublicKeys:<br/>{ 0: {evm, avalanche}, 1: {evm, avalanche}, ... }"]
        S4["publicKeys:<br/>{ 0: [...], 1: [...], ... }"]
        S5["solanaAddresses:<br/>{ 0: addr, 1: addr, ... }"]
    end

    subgraph Background["Background Discovery (discoverFromXpubs)"]
        B1["Load wallet secret"]
        B2["Get EVM xpub from index 0<br/>(shared across all accounts)"]
        B3["For each index 1–9:<br/>Get Avalanche xpub[index]"]
        B4["deriveAddressesFromXpub<br/>EVM: xpub.derive(0).derive(index)<br/>Avalanche: xpub.derive(0).derive(0)"]
        B5["Build LedgerDerivedAccount[]<br/>addressC, addressBTC, xpubXP, addressSVM"]
        B6["getActiveAccountIndices()"]
        B7["Build Redux Account objects<br/>for active indices only"]
        B1 --> B2 --> B3 --> B4 --> B5 --> B6 --> B7
    end

    Device --> Storage --> Background

    style Device fill:#1b4332,stroke:#2d6a4f,color:#d8f3dc
    style Storage fill:#3c096c,stroke:#5a189a,color:#e0aaff
    style Background fill:#003049,stroke:#023e8a,color:#caf0f8
```

### BIP44 Key Derivation Tree

```
m/44'/60'/0'              ← EVM account-level xpub (shared, fetched once)
├── 0/0                   ← Account 0 EVM address
├── 0/1                   ← Account 1 EVM address
├── 0/2                   ← Account 2 EVM address
└── ...

m/44'/9000'/0'            ← Avalanche xpub for account 0
└── 0/0                   ← Account 0 Avalanche address

m/44'/9000'/1'            ← Avalanche xpub for account 1
└── 0/0                   ← Account 1 Avalanche address

m/44'/501'/0'/0'          ← Solana key for account 0 (Ed25519, no derivation)
m/44'/501'/1'/0'          ← Solana key for account 1
```

---

## LedgerLive Discovery (Deep Dive)

LedgerLive uses **address-level public keys** — no xpubs exist, so each account needs its own key pair fetched from the device. The trade-off is that adding accounts beyond the pre-fetched range always requires the device.

```mermaid
flowchart TD
    subgraph Device["Device Key Fetch (AppConnectionScreen)"]
        D1["getAvalancheKeys(0)<br/>Full APDU flow for account 0"]
        D2["getPublicKeysForRange(1, 9)<br/>2 APDU per account × 9 = 18 calls"]
        D3["getSolanaKeysForRange(10)<br/>Ed25519 keys for Solana"]
        D1 --> D2 --> D3
    end

    subgraph Storage["Wallet Secret (BiometricsSDK)"]
        S1["deviceId, deviceName"]
        S2["derivationPathSpec: LedgerLive"]
        S3["NO extendedPublicKeys"]
        S4["publicKeys:<br/>{ 0: [{evmKey, avaxKey}], 1: [...], ... }"]
        S5["solanaAddresses:<br/>{ 0: addr, 1: addr, ... }"]
    end

    subgraph Background["Background Discovery (discoverFromPublicKeys)"]
        B1["Load wallet secret"]
        B2["For each index 1–9:<br/>Find EVM key (path contains 60')<br/>Find Avalanche key (path contains 9000')"]
        B3["deriveAddressesFromPublicKeys<br/>Direct: pubkey → address (no BIP32)"]
        B4["Build LedgerDerivedAccount[]<br/>addressC, addressBTC, xpubXP='', addressSVM"]
        B5["getActiveAccountIndices()"]
        B6["Build Redux Account objects<br/>for active indices only"]
        B1 --> B2 --> B3 --> B4 --> B5 --> B6
    end

    Device --> Storage --> Background

    style Device fill:#1b4332,stroke:#2d6a4f,color:#d8f3dc
    style Storage fill:#3c096c,stroke:#5a189a,color:#e0aaff
    style Background fill:#003049,stroke:#023e8a,color:#caf0f8
```

### LedgerLive Key Derivation Paths

```
m/44'/60'/0'/0/0          ← Account 0 EVM pubkey + address
m/44'/60'/1'/0/0          ← Account 1 EVM pubkey + address
m/44'/60'/2'/0/0          ← Account 2 EVM pubkey + address

m/44'/9000'/0'/0/0        ← Account 0 Avalanche pubkey + address
m/44'/9000'/1'/0/0        ← Account 1 Avalanche pubkey + address

m/44'/501'/0'/0'          ← Account 0 Solana (same as BIP44)
```

### Key Difference: No AVAX xpub in Balance Query

Because LedgerLive has no xpubs, `buildLedgerBalanceRequestItems` receives `xpubXP: ''` for LedgerLive accounts. The AVAX X/P-chain balance check is **skipped** (no xpub entry added to the batch). Activity detection relies on EVM, BTC, and SVM addresses only.

---

## Add Account Flow (Post-Onboarding)

After the wallet is created, users can add accounts from the portfolio settings. The flow differs by wallet type:

```mermaid
flowchart TD
    User["User taps 'Add Account'"] --> MW[useManageWallet.handleAddAccount]
    MW --> Check{Wallet type?}

    Check -- "WalletType.LEDGER<br/>(BIP44)" --> Offline["Try createLedgerAccountFromXpubs<br/>(offline from stored xpubs)"]
    Check -- "WalletType.LEDGER_LIVE" --> DeviceFlow["Navigate to<br/>AppConnectionAddAccountScreen<br/>(requires device)"]

    Offline --> HasXpub{Stored xpub<br/>for this index?}
    HasXpub -- Yes --> Create["Derive addresses offline<br/>Create Redux Account<br/>Set ledger addresses"]
    HasXpub -- No --> DeviceFlow

    DeviceFlow --> AppConn2["AppConnectionScreen<br/>(count=1, startIndex=N)"]
    AppConn2 --> Single["Fetch keys for single index<br/>from device"]
    Single --> Hook2["createLedgerAccount<br/>(UPDATE wallet secret)"]
    Hook2 --> Done["Account created"]

    Create --> Done

    style Offline fill:#1b4332,stroke:#2d6a4f,color:#d8f3dc
    style DeviceFlow fill:#e63946,stroke:#a4161a,color:#fff
```

### BIP44 Offline Fast Path

For BIP44 wallets where xpubs are already stored (indices 0–9 from the initial import), `createLedgerAccountFromXpubs` can derive all addresses **without the Ledger device**:

1. Load wallet secret → parse with `LedgerWalletSecretSchema`
2. Check `derivationPathSpec === BIP44` and xpubs exist for the index
3. Use shared EVM xpub (index 0) + per-account Avalanche xpub
4. `deriveAddressesFromXpub` for mainnet and testnet
5. Create Redux Account — no device, no balance API, instant

### LedgerLive — Always Requires Device

LedgerLive stores raw public keys, not xpubs. New account indices that weren't pre-fetched during import cannot be derived offline. The user must connect their Ledger and navigate through `AppConnectionAddAccountScreen`.

---

## Balance Activity Detection

`getActiveAccountIndices` determines which account indices have on-chain activity. It uses a two-tier approach:

```mermaid
flowchart TD
    Start["getActiveAccountIndices(accounts[])"] --> Build["buildLedgerBalanceRequestItems<br/>Group by: EVM, BTC, AVAX xpub, SVM"]
    Build --> Stream["streamingBalanceApiClient.getBalances<br/>(single batch request, streaming response)"]

    Stream --> ForEach["for await (response of stream)"]
    ForEach --> HasActivity{"hasBalanceActivity?"}
    HasActivity -- No --> ForEach
    HasActivity -- Yes --> MatchID["Match response.id → account index<br/>(EVM: case-insensitive address match)<br/>(BTC/SVM: exact address match)<br/>(AVAX: ledger-{index} ID)"]
    MatchID --> AddToSet["activeIndicesSet.add(index)"]
    AddToSet --> ForEach

    ForEach -- "Stream complete" --> Fallback["C-Chain Transaction History Fallback"]

    Fallback --> InactiveEVM["Find EVM accounts not in active set"]
    InactiveEVM --> TxHistory["ModuleManager.getTransactionHistory<br/>per inactive EVM address (offset: 1)"]
    TxHistory --> HasTx{"Has transactions?"}
    HasTx -- Yes --> AddToSet2["activeIndicesSet.add(index)"]
    HasTx -- No --> Skip
    AddToSet2 --> Skip
    Skip --> Final["Always add index 0"]

    Final --> FillGaps["Fill gaps 0..max(activeIndices)<br/>e.g. {0, 3} → [0, 1, 2, 3]"]
    FillGaps --> Return["Return sorted contiguous array"]

    style Stream fill:#003049,stroke:#023e8a,color:#caf0f8
    style Fallback fill:#5c4d7d,stroke:#7b68ae,color:#e8dff5
```

### Balance Activity Types Checked

| Network Type | Activity Sources |
|-------------|-----------------|
| `evm` | Native token balance, ERC-20 token balances |
| `btc` | Native token balance, unconfirmed balance |
| `svm` | Native token balance, SPL token balances |
| `avm` | Native balance, unlocked/locked categories, atomic memory |
| `pvm` | Native balance, staked/unstaked categories, atomic memory |
| `coreth` | Native balance, atomic memory (unlocked + locked) |

### Fallback Strategy

The C-Chain history fallback catches accounts that **had past activity but now have zero balance** (e.g., user moved all funds out). The Balance API only reports current balances, so historical transaction checks fill the gap.

---

## Key Material Storage

All key material is stored via `BiometricsSDK` as a JSON wallet secret, built by `buildLedgerWalletSecret`:

```mermaid
flowchart LR
    subgraph Operations
        NEW["WalletSecretOperation.NEW<br/>Initial wallet creation"]
        UPDATE["WalletSecretOperation.UPDATE<br/>Add account to existing wallet"]
        SOLANA["WalletSecretOperation.SOLANA_UPDATE<br/>Add Solana keys to existing account"]
    end

    subgraph Secret["Wallet Secret Structure"]
        direction TB
        Base["deviceId<br/>deviceName<br/>derivationPathSpec"]
        XPK["extendedPublicKeys (BIP44 only)<br/>{ index: { evm, avalanche } }"]
        PK["publicKeys<br/>{ index: [{ key, derivationPath, curve }] }"]
        SOL["solanaAddresses (NEW only)<br/>{ index: address }"]
    end

    NEW --> Base
    NEW --> XPK
    NEW --> PK
    NEW --> SOL

    UPDATE -- "merge xpubs at index" --> XPK
    UPDATE -- "merge + dedup keys at index" --> PK

    SOLANA -- "append + dedup at index" --> PK

    style Operations fill:#2d3436,stroke:#636e72,color:#dfe6e9
    style Secret fill:#2d3436,stroke:#636e72,color:#dfe6e9
```

The secret is validated at read time with `LedgerWalletSecretSchema` (Zod), which ensures structural integrity even if the stored JSON was created by a different app version.

---

## File Map

| Area | File | Purpose |
|------|------|---------|
| **Screens** | `screens/PathSelectionScreen.tsx` | User picks BIP44 vs LedgerLive |
| | `screens/AppConnectionScreen.tsx` | Device key fetch (shared between onboarding + add account) |
| | `screens/AppConnectionOnboardingScreen.tsx` | Wallet creation + triggers background discovery |
| | `screens/AppConnectionAddAccountScreen.tsx` | Single account addition (device required) |
| **Hooks** | `hooks/useLedgerWallet.ts` | `createLedgerWallet`, `createLedgerAccount`, `updateSolanaForLedgerWallet` |
| | `hooks/useSetLedgerAddress.ts` | Derives + stores ledger addresses for a given account |
| **Utils** | `utils/index.ts` | `buildLedgerWalletSecret`, `buildKeysFromMultiIndex`, `getFormattedAddresses`, `LedgerWalletSecretSchema` |
| | `utils/discoverLedgerAccounts.ts` | `getActiveAccountIndices`, `buildLedgerBalanceRequestItems`, `hasBalanceActivity` |
| | `utils/discoverLedgerAccountsFromXpubs.ts` | Background discovery entry point: `discoverFromXpubs` (BIP44) / `discoverFromPublicKeys` (LedgerLive) |
| | `utils/createLedgerAccountFromXpubs.ts` | BIP44-only offline account creation |
| **Services** | `services/ledger/LedgerService.ts` | Device APDU communication |
| | `services/ledger/deriveAddressesOffline.ts` | `deriveAddressesFromXpub`, `deriveAddressesFromPublicKeys` |
| | `services/ledger/types.ts` | `LedgerDerivationPathType`, `WalletSecretOperation`, `WalletSecretParams`, `LedgerMultiIndexKeys` |
| **Store** | `store/account/listeners.ts` | `onWalletImported` listener → `migrateLedgerActiveAccounts` |
| | `store/app/slice.ts` | `onWalletImported` action creator |
| **Integration** | `common/hooks/useManageWallet.ts` | Portfolio "Add Account" → offline or device flow |
