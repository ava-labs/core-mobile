# Native Batch Address Derivation

**Ticket:** CP-14062  
**Status:** Implemented

## Problem

Background account discovery (`discoverRemainingActiveAccounts`) performs synchronous cryptographic operations (BIP32 derivation, Keccak-256, SHA-256, RIPEMD-160, bech32/base58 encoding) in tight loops on the JS thread. This starves the JS thread and makes the app unresponsive — buttons stop working, BLE callbacks pile up, and concurrent flows like Ledger onboarding freeze.

The repro is: log in with a mnemonic wallet, and while the "Adding accounts..." toast is visible (discovery running), attempt Ledger onboarding. The onboarding flow is completely unresponsive.

## Solution

Add three async Nitro Module functions to the existing `react-native-nitro-avalabs-crypto` package that perform all per-account address derivation on a native background thread, freeing the JS thread entirely.

1. **`deriveAddressesFromXpubs`** — secp256k1 addresses from BIP32 extended public keys (used by Ledger offline discovery)
2. **`deriveSolanaAddressesFromSeed`** — Solana addresses via SLIP-0010 Ed25519 from BIP39 seed (standalone Solana derivation)
3. **`deriveAllAddressesFromSeed`** — all addresses (secp256k1 + Ed25519) from BIP39 seed in a single native call (primary function for mnemonic discovery)

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

**Used by:** Ledger offline discovery (where xpubs are already available from the device).

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

**Used by:** Available as standalone for callers that only need Solana addresses. Ledger gets Solana addresses directly from the device via APDU.

### Function 3: `deriveAllAddressesFromSeed`

Derives ALL addresses (secp256k1 + Ed25519) for multiple account indices from a BIP39 seed in a single native call. This is the primary function for mnemonic wallet discovery — the JS thread does zero crypto work.

```typescript
async deriveAllAddressesFromSeed(
  seed: ArrayBuffer,
  accountIndices: number[],
  isTestnet: boolean
): Promise<DerivedAllAddresses[]>

interface DerivedAllAddresses {
  accountIndex: number
  evm: string       // 0x-prefixed EIP-55 checksummed address
  btc: string       // bech32 P2WPKH address (bc1... or tb1...)
  avm: string       // X-{bech32} with avax/fuji HRP
  pvm: string       // P-{bech32} with avax/fuji HRP
  coreEth: string   // C-{bech32} with avax/fuji HRP
  solana: string    // base58-encoded Ed25519 public key
}
```

**Inputs:**
- `seed`: 64-byte BIP39 seed (ArrayBuffer)
- `accountIndices`: account indices to derive
- `isTestnet`: true → fuji/tb1; false → avax/bc1

**Internal derivation (all in C++, single native call):**
1. BIP32 master from seed: HMAC-SHA512(`"Bitcoin seed"`, seed) → master private key + chain code (once)
2. EVM xpub at `m/44'/60'/0'`: hardened derivation from master → public key extraction (once, shared across all accounts)
3. SLIP-0010 master from seed: HMAC-SHA512(`"ed25519 seed"`, seed) → Ed25519 master (once, shared across all accounts)
4. Per account index:
   - Avalanche xpub at `m/44'/9000'/{accountIndex}'`: hardened derivation from BIP32 master
   - All secp256k1 addresses from EVM + Avalanche xpubs (same logic as `deriveAddressesFromXpubs`)
   - Solana address via SLIP-0010 `m/44'/501'/{accountIndex}'/0'` from pre-computed Ed25519 master
5. All seed and private key material zeroed with `OPENSSL_cleanse` after use

**Used by:** Mnemonic account discovery and `reloadAccounts` for mnemonic wallets.

## C++ Implementation

### Code in `react-native-nitro-avalabs-crypto`

All crypto helpers are implemented as header-only `.hpp` files for simplicity (inline functions, no separate compilation units).

**Files:**

| File | Purpose |
|---|---|
| `cpp/CryptoHybrid.cpp` | `deriveAddressesFromXpubs`, `deriveSolanaAddressesFromSeed`, and `deriveAllAddressesFromSeed` method implementations |
| `cpp/CryptoHybrid.hpp` | Class declaration with Nitro spec overrides |
| `cpp/address_derivation.hpp` | BIP32 public + hardened private child derivation, xpub parsing (via base58), secp256k1 address encoding (EVM, BTC, Avalanche), full seed-to-addresses pipeline |
| `cpp/slip0010.hpp` | SLIP-0010 Ed25519 hardened derivation + Solana address encoding |
| `cpp/keccak256.hpp` | Standalone Keccak-256 (Ethereum variant, NOT SHA3-256) |
| `cpp/bech32.hpp` | BIP-173 bech32 encoding for BTC P2WPKH + Avalanche addresses |
| `cpp/base58.hpp` | Base58Check decode (xpub parsing) + Base58 encode (Solana addresses) |
| `src/specs/Crypto.nitro.ts` | Nitro spec with all three method signatures + result types |
| `src/Crypto.ts` | JS wrapper functions |

### Dependencies (all already available)

| Library | Status | Used for |
|---|---|---|
| libsecp256k1 | Already included | `secp256k1_ec_pubkey_tweak_add`, `secp256k1_ec_pubkey_parse`, `secp256k1_ec_pubkey_serialize`, `secp256k1_ec_seckey_tweak_add` (hardened derivation) |
| OpenSSL | Already included | HMAC-SHA512, SHA-256, RIPEMD-160, Ed25519 point derivation, `RAND_bytes` (context randomization), `OPENSSL_cleanse` (key zeroing) |
| Keccak-256 | Standalone header | EVM address derivation (NOT SHA3-256; Ethereum uses pre-NIST Keccak) |
| Bech32 | Standalone header | BTC P2WPKH + Avalanche addresses |
| Base58 | Standalone header | xpub parsing, Solana address encoding |

### Nitro spec

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

  deriveAllAddressesFromSeed(
    seed: ArrayBuffer,
    accountIndices: number[],
    isTestnet: boolean
  ): Promise<DerivedAllAddresses[]>
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

interface DerivedAllAddresses {
  accountIndex: number
  evm: string
  btc: string
  avm: string
  pvm: string
  coreEth: string
  solana: string
}
```

After updating the spec, run `yarn specs` to regenerate the Nitrogen bindings.

## Security

### Key material handling

- The BIP39 seed crosses into native memory within the same process (no new trust boundary).
- `OPENSSL_cleanse` zeroes all seed and private key copies after use:
  - `deriveAllAddressesFromSeed`: seed bytes, BIP32 master key, EVM private key, SLIP-0010 master secret + chain code
  - `deriveSolanaAddressesFromSeed`: seed bytes
  - `bip32_master_from_seed`: HMAC output `I`
  - `bip32_derive_hardened_child`: HMAC output `I`, intermediate key `IL`, `data` buffer (contains parent private key)
  - `derive_all_addresses_for_index`: Avalanche private key after public key extraction
  - `slip0010_master_key` / `slip0010_derive_hardened`: HMAC outputs, `data` buffers containing secret material
  - `solana_address_from_master` / `solana_address_from_seed`: derived secrets, master key material

### Side-channel protection

- secp256k1 context randomized with `RAND_bytes()` (OpenSSL CSPRNG) on first use, seed cleansed after. Protects against timing/power side-channel attacks on EC operations.

### Robustness

- `sha256()` and `ripemd160()` check `EVP_MD_CTX_new()` for null and verify all `EVP_Digest*` return values, freeing the context on every error path. Prevents silent incorrect hash outputs (which would produce wrong wallet addresses).
- `base58_map()` uses C++11 thread-safe static local initialization (lambda-initialized `std::array`) instead of a manual `bool` flag pattern that had a data race.

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

In `discoverSeedBasedActiveAccounts()`, replace the per-account `ModuleManager.deriveAddresses()` call with a single `deriveAllAddressesFromSeed(seed, windowIndices, isTestnet)` call. This derives all addresses (EVM, BTC, AVM, PVM, CoreEth, Solana) for the entire window in one native call — no JS-side xpub derivation or separate Solana call needed.

This replaces `ModuleManager.deriveAddresses()` for the discovery use case only. Normal single-address derivation (e.g., for transaction signing) continues to use the VM modules.

### 4. Mnemonic `reloadAccounts`

**File:** `packages/core-mobile/app/store/account/listeners.ts`

`reloadAccounts` (Phase 2 of the `onAppUnlockedOrchestrator`) batches all account indices into a single `deriveAllAddressesFromSeed` native call for mnemonic wallets, instead of looping through `ModuleManager.deriveAddresses` per account on the JS thread.

## Testing

### Unit tests for native functions

- Derive addresses from known xpubs and verify against expected addresses (use test vectors from BIP32/BIP44 specs)
- Derive Solana addresses from known seeds and verify against expected base58 addresses
- Derive all addresses from seed and verify all 6 address types match expected values
- Test with both mainnet and testnet parameters
- Test with empty and large account index arrays
- Test with invalid xpub strings (should throw, not crash)

### Integration tests

- Verify that `deriveAddressesBatch` produces identical results to the existing `deriveAddressesFromXpub` for the same inputs
- Verify that `deriveSolanaAddressesBatch` produces identical results to the existing JS Solana derivation
- Verify that `deriveAllAddressesFromSeed` produces identical results to calling `deriveAddressesBatch` + `deriveSolanaAddressesBatch` separately
- Run mnemonic account discovery with the native path and verify same accounts are discovered

### Performance validation

- Measure time to derive 10 accounts via JS (before) vs native (after)
- Verify JS thread is not blocked during native derivation (UI remains responsive)
- Test the specific repro: mnemonic login + Ledger onboarding simultaneously

## Rollout

The native functions are additive — existing JS implementations remain as fallback. Integration points are updated one at a time:
1. First: Ledger offline derivation (simplest, self-contained)
2. Second: Ledger discovery loop
3. Third: Mnemonic discovery via `deriveAllAddressesFromSeed` (most impactful, single native call)
4. Fourth: `reloadAccounts` native path for mnemonic wallets

Each step can be verified independently before moving to the next.

## Out of Scope

- Moving BIP39 mnemonic-to-seed derivation (PBKDF2) to native — done once, cached, not a bottleneck
- Changing VM module `deriveAddress()` — these are external packages; we bypass them for discovery only
- Solana derivation for Ledger wallets — Ledger provides Solana addresses via APDU
