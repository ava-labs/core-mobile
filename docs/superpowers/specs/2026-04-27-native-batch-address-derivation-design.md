# Native Batch Address Derivation

**Ticket:** CP-14062  
**Date:** 2026-04-27  
**Status:** Draft

## Problem

Background account discovery (`discoverRemainingActiveAccounts`) performs synchronous cryptographic operations (BIP32 derivation, Keccak-256, SHA-256, RIPEMD-160, bech32/base58 encoding) in tight loops on the JS thread. This starves the JS thread and makes the app unresponsive — buttons stop working, BLE callbacks pile up, and concurrent flows like Ledger onboarding freeze.

The repro is: log in with a mnemonic wallet, and while the "Adding accounts..." toast is visible (discovery running), attempt Ledger onboarding. The onboarding flow is completely unresponsive.

## Solution

Add two async Nitro Module functions to the existing `react-native-nitro-avalabs-crypto` package that perform all per-account address derivation on a native background thread, freeing the JS thread entirely.

## API Design

### Function 1: `deriveAddressesFromXpubs`

Derives addresses for secp256k1-based chains (EVM, BTC, Avalanche X/P/CoreEth) from BIP32 extended public keys.

```typescript
async deriveAddressesFromXpubs(
  evmXpub: string,
  avalancheXpub: string,
  isTestnet: boolean,
  accountIndices: number[]
): Promise<DerivedSecp256k1Addresses[]>

interface DerivedSecp256k1Addresses {
  accountIndex: number
  evm: string       // 0x-prefixed EIP-55 checksummed address
  btc: string       // bech32 P2WPKH address (bc1... or tb1...)
  avm: string       // X-{bech32} with avax/fuji HRP
  pvm: string       // P-{bech32} with avax/fuji HRP
  coreEth: string   // C-{bech32} with avax/fuji HRP
}
```

**Inputs:**
- `evmXpub`: base58-encoded xpub at account level, e.g. `m/44'/60'/0'` (BIP44) or `m/44'/60'/{account}'` (LedgerLive)
- `avalancheXpub`: base58-encoded xpub at account level, e.g. `m/44'/9000'/{account}'`
- `isTestnet`: controls HRP (`avax` vs `fuji`) and BTC network (`bc` vs `tb`)
- `accountIndices`: array of BIP32 address indices to derive (e.g. `[0, 1, 2, ..., 9]`)

**Per-index derivation logic (all in C++):**
1. Parse xpub from base58 → extract compressed public key (33 bytes) + chain code (32 bytes)
2. BIP32 public child derivation: derive `evmXpub/0/{accountIndex}` → EVM child pubkey
3. BIP32 public child derivation: derive `avalancheXpub/0/0` → Avalanche child pubkey
4. EVM address: decompress EVM pubkey → Keccak-256 of uncompressed (sans prefix) → last 20 bytes → EIP-55 checksum
5. BTC address: SHA-256(EVM pubkey) → RIPEMD-160 → bech32 P2WPKH (witness version 0)
6. Avalanche bech32 (AVM, PVM): SHA-256(Avalanche pubkey) → RIPEMD-160 → bech32 with `avax`/`fuji` HRP
7. CoreEth bech32: SHA-256(EVM pubkey) → RIPEMD-160 → bech32 with `avax`/`fuji` HRP

**Used by:** Both Ledger offline discovery and mnemonic account discovery.

### Function 2: `deriveSolanaAddressesFromSeed`

Derives Solana addresses from a BIP39 seed using SLIP-0010 Ed25519 hardened derivation.

```typescript
async deriveSolanaAddressesFromSeed(
  seed: ArrayBuffer,
  accountIndices: number[]
): Promise<DerivedSolanaAddress[]>

interface DerivedSolanaAddress {
  accountIndex: number
  address: string    // base58-encoded 32-byte Ed25519 public key
}
```

**Inputs:**
- `seed`: 64-byte BIP39 seed (derived from mnemonic via PBKDF2 — done once in JS, cached)
- `accountIndices`: array of account indices to derive

**Per-index derivation logic (all in C++):**
1. SLIP-0010 master key: HMAC-SHA512(`"ed25519 seed"`, seed) → master secret (32 bytes) + master chain code (32 bytes)
2. Hardened child derivation at path `m/44'/501'/{accountIndex}'/0'`:
   - For each path segment `i'`: HMAC-SHA512(chainCode, `0x00` || secret || `i + 0x80000000`) → new secret + chainCode
3. Ed25519 scalar-to-point: secret → public key (32 bytes)
4. Base58 encode public key → Solana address string

**Used by:** Mnemonic account discovery only. Ledger gets Solana addresses directly from the device via APDU.

## C++ Implementation

### New code in `react-native-nitro-avalabs-crypto`

**Files to create/modify:**

| File | Purpose |
|---|---|
| `cpp/CryptoHybrid.cpp` | Add `deriveAddressesFromXpubs` and `deriveSolanaAddressesFromSeed` method implementations |
| `cpp/bip32.h` / `cpp/bip32.cpp` | BIP32 public child derivation + xpub base58 parsing |
| `cpp/slip0010.h` / `cpp/slip0010.cpp` | SLIP-0010 Ed25519 hardened derivation |
| `cpp/address.h` / `cpp/address.cpp` | Address encoding: EVM (Keccak + EIP-55), BTC (P2WPKH bech32), Avalanche (bech32 with HRP) |
| `cpp/keccak256.h` / `cpp/keccak256.cpp` | Standalone Keccak-256 implementation (~200 LOC) |
| `cpp/bech32.h` / `cpp/bech32.cpp` | Bech32/bech32m encoding (~100 LOC, from BIP-173 reference) |
| `cpp/base58.h` / `cpp/base58.cpp` | Base58 + Base58Check encode/decode (~80 LOC) |
| `src/specs/Crypto.nitro.ts` | Add new method signatures to the Nitro spec |
| `src/Crypto.ts` | Add JS wrapper functions |

### Dependencies (all already available or trivially addable)

| Library | Status | Used for |
|---|---|---|
| libsecp256k1 | Already included | `secp256k1_ec_pubkey_tweak_add`, `secp256k1_ec_pubkey_parse`, `secp256k1_ec_pubkey_serialize` |
| OpenSSL | Already included | HMAC-SHA512, SHA-256, RIPEMD-160, Ed25519 point derivation |
| Keccak-256 | Add standalone | EVM address derivation (NOT SHA3-256; Ethereum uses pre-NIST Keccak) |
| Bech32 | Add standalone | BTC P2WPKH + Avalanche addresses |
| Base58 | Add standalone | xpub parsing, Solana address encoding |

### Nitro spec changes

```typescript
// Added to existing Crypto interface in Crypto.nitro.ts
interface Crypto extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  // ... existing methods ...

  // Batch address derivation (async — runs on native thread)
  deriveAddressesFromXpubs(
    evmXpub: string,
    avalancheXpub: string,
    isTestnet: boolean,
    accountIndices: number[]
  ): Promise<DerivedSecp256k1Addresses[]>

  deriveSolanaAddressesFromSeed(
    seed: ArrayBuffer,
    accountIndices: number[]
  ): Promise<DerivedSolanaAddress[]>
}

interface DerivedSecp256k1Addresses {
  accountIndex: number
  evm: string
  btc: string
  avm: string
  pvm: string
  coreEth: string
}

interface DerivedSolanaAddress {
  accountIndex: number
  address: string
}
```

After updating the spec, run `yarn specs` to regenerate the Nitrogen bindings.

## Integration Points

### 1. Ledger offline discovery

**File:** `packages/core-mobile/app/services/ledger/deriveAddressesOffline.ts`

Replace the synchronous `deriveAddressesFromXpub()` function with an async wrapper that calls the native function:

```typescript
// Before: synchronous, blocks JS thread per-index
export function deriveAddressesFromXpub(evmXpub, avalancheXpub, isTestnet, evmAddressIndex) {
  const evmPubKey = derivePublicKey(evmXpub, 0, evmAddressIndex)  // sync BIP32
  // ... sync address encoding ...
}

// After: async, runs on native thread, batch all indices in one call
export async function deriveAddressesBatch(
  evmXpub: string,
  avalancheXpub: string,
  isTestnet: boolean,
  accountIndices: number[]
): Promise<Map<number, DerivedAddresses>> {
  const results = await NativeCrypto.deriveAddressesFromXpubs(
    evmXpub, avalancheXpub, isTestnet, accountIndices
  )
  // Map native results to existing DerivedAddresses type
}
```

The existing sync `deriveAddressesFromXpub` is kept for backward compatibility but callers should migrate to the batch version.

### 2. Ledger account discovery loop

**File:** `packages/core-mobile/app/new/features/ledger/utils/discoverLedgerAccountsFromXpubs.ts`

Replace the `for` loop over `additionalIndices` (calling `deriveAddressesFromXpub` per index) with a single `deriveAddressesBatch(evmXpub, avalancheXpub, isTestnet, additionalIndices)` call.

### 3. Mnemonic account discovery

**File:** `packages/core-mobile/app/services/account/AccountsService.tsx`

In `discoverSeedBasedActiveAccounts()`, replace the per-account `ModuleManager.deriveAddresses()` call with:
1. Derive xpubs once from the wallet seed (BIP32 hardened — still in JS, but only 2 derivations)
2. Call `deriveAddressesBatch(evmXpub, avalancheXpub, isTestnet, windowIndices)` for the entire window
3. Call `deriveSolanaAddressesBatch(seed, windowIndices)` for Solana addresses
4. Merge results into the existing address map format

This replaces `ModuleManager.deriveAddresses()` for the discovery use case only. Normal single-address derivation (e.g., for transaction signing) continues to use the VM modules.

### 4. Mnemonic xpub derivation helper

**File:** `packages/core-mobile/app/services/account/AccountsService.tsx` (or new utility)

Add a helper that derives account-level xpubs from the wallet seed:

```typescript
async function deriveXpubsForDiscovery(
  walletId: string,
  walletType: WalletType
): Promise<{ evmXpub: string; avalancheXpub: string; seed: ArrayBuffer }>
```

This calls the existing `WalletService` to get the mnemonic, derives the seed (BIP39), then derives the two account-level xpubs using the existing `bip32` utility. This is done once per discovery run (not per account).

## Testing

### Unit tests for native functions

- Derive addresses from known xpubs and verify against expected addresses (use test vectors from BIP32/BIP44 specs)
- Derive Solana addresses from known seeds and verify against expected base58 addresses
- Test with both mainnet and testnet parameters
- Test with empty and large account index arrays
- Test with invalid xpub strings (should throw, not crash)

### Integration tests

- Verify that `deriveAddressesBatch` produces identical results to the existing `deriveAddressesFromXpub` for the same inputs
- Verify that `deriveSolanaAddressesBatch` produces identical results to the existing JS Solana derivation
- Run mnemonic account discovery with the native path and verify same accounts are discovered

### Performance validation

- Measure time to derive 10 accounts via JS (before) vs native (after)
- Verify JS thread is not blocked during native derivation (UI remains responsive)
- Test the specific repro: mnemonic login + Ledger onboarding simultaneously

## Rollout

The native functions are additive — existing JS implementations remain as fallback. Integration points are updated one at a time:
1. First: Ledger offline derivation (simplest, self-contained)
2. Second: Ledger discovery loop
3. Third: Mnemonic discovery (most impactful, requires xpub derivation helper)

Each step can be verified independently before moving to the next.

## Out of Scope

- Moving BIP39 mnemonic-to-seed derivation (PBKDF2) to native — done once, cached, not a bottleneck
- Moving BIP32 hardened derivation from seed to xpubs to native — only 2 derivations per wallet, not per-account
- Changing VM module `deriveAddress()` — these are external packages; we bypass them for discovery only
- Solana derivation for Ledger wallets — Ledger provides Solana addresses via APDU
