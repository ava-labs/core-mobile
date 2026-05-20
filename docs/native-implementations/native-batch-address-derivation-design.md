# Native Batch Address Derivation

**Ticket:** CP-14062
**Status:** Implemented

## Problem

Background account discovery (`discoverSeedBasedActiveAccounts`) performs synchronous cryptographic operations (BIP32 derivation, Keccak-256, SHA-256, RIPEMD-160, bech32/base58 encoding) in tight loops on the JS thread. This starves the JS thread and makes the app unresponsive — buttons stop working, BLE callbacks pile up, and concurrent flows like Ledger onboarding freeze.

The repro is: log in with a mnemonic wallet, and while the "Adding accounts..." toast is visible (discovery running), attempt Ledger onboarding. The onboarding flow is completely unresponsive.

## Solution

Add async Nitro Module functions to the existing `react-native-nitro-avalabs-crypto` package that perform per-account address derivation on a native background thread (or with zero JS-side encoding cost). Two complementary entry points:

1. **`deriveAddressesFromXpubs`** — secp256k1 addresses from BIP32 extended public keys, parallelized across `std::thread::hardware_concurrency()` worker threads internally. Used by Ledger offline discovery, where xpubs come from the device.

2. **Per-chain batched encoders** — `deriveAddressesForEvm`, `deriveAddressesForBtc`, `deriveAddressesForSvm`, `deriveAddressesForAvalanche`. Each accepts an array of already-derived public keys and returns an array of addresses in the same order. Used by the new `ModuleManager.deriveAllAddresses` orchestrator (mnemonic and seedless paths), which fetches pubkeys via `WalletService.getPublicKeyFor` (warm-cache friendly) and then makes one batched native call per chain.

> An earlier `deriveAllAddressesFromSeed` variant — taking the BIP39 seed and doing the entire BIP32 derivation tree natively — was implemented and later removed in favor of the orchestrator pattern. Rationale: feeding the seed across the bridge has a larger secret-material surface, the pubkey cache already eliminates per-account derivation cost on the warm path, and the orchestrator works for non-mnemonic wallets too. A `deriveAllAddressesFromPrivateKey` variant (single 32-byte private key → all six addresses) was likewise removed once the per-chain encoders covered every consumer.

## API Design

### Function 1: `deriveAddressesFromXpubs`

Derives addresses for secp256k1-based chains (EVM, BTC, Avalanche X/P/CoreEth) from BIP32 extended public keys. Async — runs on a native background thread, parallelized internally.

```typescript
async deriveAddressesFromXpubs(
  evmXpub: string,
  avalancheXpubs: string[],
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
- `evmXpub`: base58-encoded shared xpub at `m/44'/60'/0'` (one xpub for all accounts; EVM addresses come from child path `0/{accountIndex}`)
- `avalancheXpubs`: array of base58-encoded per-account xpubs at `m/44'/9000'/{account}'`, one per account index and aligned with `accountIndices` (Avalanche addresses come from child path `0/0` within each xpub). Must be the same length as `accountIndices`.
- `isTestnet`: controls HRP (`avax` vs `fuji`) and BTC network (`bc` vs `tb`)
- `accountIndices`: array of BIP32 address indices to derive (e.g. `[0, 1, 2, ..., 9]`). Capped at 1024 per call.

**Per-index derivation logic (all in C++):**
1. Parse xpub from base58 → extract compressed public key (33 bytes) + chain code (32 bytes)
2. BIP32 public child derivation: derive `evmXpub/0/{accountIndex}` → EVM child pubkey
3. BIP32 public child derivation: derive `avalancheXpubs[i]/0/0` → Avalanche child pubkey (where `i` is the position in `accountIndices`)
4. EVM address: decompress EVM pubkey → Keccak-256 of uncompressed (sans prefix) → last 20 bytes → EIP-55 checksum
5. BTC address: SHA-256(EVM pubkey) → RIPEMD-160 → bech32 P2WPKH (witness version 0)
6. Avalanche bech32 (AVM, PVM): SHA-256(Avalanche pubkey) → RIPEMD-160 → bech32 with `avax`/`fuji` HRP
7. CoreEth bech32: SHA-256(EVM pubkey) → RIPEMD-160 → bech32 with `avax`/`fuji` HRP

**Used by:** Ledger offline discovery (where xpubs are already available from the device).

The JS wrapper validates `avalancheXpubs.length === accountIndices.length` before dispatching to native — a mismatch would otherwise produce wrong per-account addresses, so it fails loudly with the offending counts in the message.

### Function set 2: Per-chain batched encoders

Synchronous native functions that take an array of pre-derived public keys and return an array of addresses. Used by `ModuleManager.deriveAllAddresses` (see orchestrator below). One bridge crossing per chain per discovery window, regardless of N.

```typescript
deriveAddressesForEvm(publicKeys: ArrayBuffer[]): string[]
deriveAddressesForSvm(publicKeys: ArrayBuffer[]): string[]
deriveAddressesForBtc(publicKeys: ArrayBuffer[], isTestnet: boolean): string[]
deriveAddressesForAvalanche(
  avalanchePublicKeys: ArrayBuffer[],
  evmPublicKeys: ArrayBuffer[],
  isTestnet: boolean
): DerivedAvalancheAddresses[]

interface DerivedAvalancheAddresses {
  x: string       // X-{bech32}, from avalanche pubkey
  p: string       // P-{bech32}, from avalanche pubkey
  coreEth: string // C-{bech32}, from evm pubkey
}
```

**Inputs:**
- `publicKeys` — array of pubkeys (33-byte compressed secp256k1 for EVM/BTC/Avalanche; 32-byte Ed25519 for SVM). Per-element length is validated; out-of-range bytes throw `std::invalid_argument` with the offending element index. JS wrapper accepts hex strings, `ArrayBuffer`, or `Uint8Array` and normalizes per-element.
- For `deriveAddressesForAvalanche`: two parallel arrays — X-/P- addresses come from `avalanchePublicKeys[i]` (m/44'/9000'/…), and the CoreEth bech32 from `evmPublicKeys[i]` (m/44'/60'/…). Both arrays must be equal length; mismatch throws.
- All four functions cap N at 1024 per call (mirrors `deriveAddressesFromXpubs`).

**Result ordering contract:** results align with input by position. C++ implementations are serial `for` loops with `push_back` / `emplace_back` (no `parallelFor`) so order is preserved. On any per-element validation failure the entire call throws — JS never sees a partial result vector.

**Used by:** the new `ModuleManager.deriveAllAddresses` orchestrator described next.

### Orchestrator: `ModuleManager.deriveAllAddresses`

JS-side method on `ModuleManager` that replaces the legacy per-account `ModuleManager.deriveAddresses` for batched flows. One call derives all addresses across all six VM types for an array of account indices.

```typescript
deriveAllAddresses({
  walletId: string
  walletType: WalletType
  accountIndices: number[]
  network: Network
}): Promise<Array<{
  accountIndex: number
  addresses: Record<NetworkVMType, string>
}>>
```

**Flow:**
1. For each `accountIndex`, build the EVM / AVM / SVM derivation paths via the memoized `getAddressDerivationPath` helper. Solana support gate (`isSolanaSupportBlocked`) is honored upstream at the caller, not here.
2. Three parallel `Promise.all` blocks fetch pubkeys via `WalletService.getPublicKeyFor` — one for each curve/path combination. Repeat callers hit `WalletFactory.cache` (warm-cache path is a `Map.get`).
3. One batched native call per chain — `deriveAddressesForEvm(evmHex)`, `deriveAddressesForBtc(evmHex, isTestnet)`, `deriveAddressesForAvalanche(avmHex, evmHex, isTestnet)`, `deriveAddressesForSvm(svmHex)`. Hex pubkeys pass through unchanged — no intermediate ArrayBuffer copy in JS.
4. Zip the four parallel result arrays into per-account records keyed by `accountIndex`. Result array is aligned with input `accountIndices`.

**Used by:**
- `discoverSeedBasedActiveAccounts` — single batched call per discovery window
- `fillDiscoveredAccountGaps` — single batched call for all gap indices (rare path; most discoveries have zero gaps)
- `reloadAccounts` — single batched call for all non-Ledger accounts in the wallet
- `getAddresses` (single-account public API) — passes `[accountIndex]` and unwraps `[0].addresses`. The single code path is intentional; sub-ms on warm cache.

## C++ Implementation

### Code in `react-native-nitro-avalabs-crypto`

All crypto helpers are implemented as header-only `.hpp` files (inline functions, no separate compilation units).

**Files:**

| File | Purpose |
|---|---|
| `cpp/CryptoHybrid.cpp` | `deriveAddressesFromXpubs` (parallelized) + the four per-chain batched encoders (serial); shared `parallelFor` worker-pool helper; shared `validatePubkeyBatchSize` / `validateAccountIndices` guards |
| `cpp/CryptoHybrid.hpp` | Class declaration with Nitro spec overrides |
| `cpp/address_derivation.hpp` | BIP32 public child derivation, xpub parsing (via base58), secp256k1 address encoding (EVM, BTC, Avalanche). Public-key path only — private-key BIP32 helpers were removed with `deriveAllAddressesFromSeed`. |
| `cpp/keccak256.hpp` | Standalone Keccak-256 (Ethereum variant, NOT SHA3-256) |
| `cpp/bech32.hpp` | BIP-173 bech32 encoding for BTC P2WPKH + Avalanche addresses (rejects uppercase HRP; rejects witness_version ≥ 1 to guard against shipping invalid P2TR addresses with a BIP-173 encoder) |
| `cpp/base58.hpp` | Base58Check decode (xpub parsing) + Base58 encode (Solana addresses) |
| `cpp/scope_guard.hpp` | `ScopeGuard<F>` RAII helper for `OPENSSL_cleanse` on every exit path |
| `src/specs/Crypto.nitro.ts` | Nitro spec with all method signatures + result types |
| `src/Crypto.ts` | JS wrappers (per-element length validation, `MAX_BATCH_SIZE = 1024` early-rejection, hex/ArrayBuffer/Uint8Array normalization) |

> `slip0010.hpp` (Ed25519 SLIP-0010 derivation), `CleansingArray<N>` (auto-cleansing fixed-size byte buffer), and the BIP32 private-key helpers (`bip32_master_from_seed`, `bip32_derive_hardened_child`, `bip32_derive_hardened_path`, `bip32_private_to_public`, `bip32_derive_hardened_xpub_path`, `derive_all_addresses_for_index`) were removed with `deriveAllAddressesFromSeed` and `deriveAllAddressesFromPrivateKey`. The remaining native surface is pubkey-only — no secret material flows through it.

### Dependencies (all already available)

| Library | Status | Used for |
|---|---|---|
| libsecp256k1 | Already included | `secp256k1_ec_pubkey_tweak_add`, `secp256k1_ec_pubkey_parse`, `secp256k1_ec_pubkey_serialize` (public child derivation, pubkey decompression for EVM) |
| OpenSSL | Already included | HMAC-SHA512, SHA-256, RIPEMD-160, `RAND_bytes` (context randomization), `OPENSSL_cleanse` (key zeroing on the sign/extended-pubkey paths) |
| Keccak-256 | Standalone header | EVM address derivation (NOT SHA3-256; Ethereum uses pre-NIST Keccak) |
| Bech32 | Standalone header | BTC P2WPKH + Avalanche addresses |
| Base58 | Standalone header | xpub parsing, Solana address encoding |

### Nitro spec

```typescript
// Crypto.nitro.ts — abbreviated
interface Crypto extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  // ... existing signing methods ...

  // Async, parallelized — Ledger offline path
  deriveAddressesFromXpubs(
    evmXpub: string,
    avalancheXpubs: string[],
    isTestnet: boolean,
    accountIndices: number[]
  ): Promise<DerivedSecp256k1Addresses[]>

  // Synchronous per-chain encoders — used by ModuleManager.deriveAllAddresses
  deriveAddressesForEvm(publicKeys: ArrayBuffer[]): string[]
  deriveAddressesForSvm(publicKeys: ArrayBuffer[]): string[]
  deriveAddressesForBtc(publicKeys: ArrayBuffer[], isTestnet: boolean): string[]
  deriveAddressesForAvalanche(
    avalanchePublicKeys: ArrayBuffer[],
    evmPublicKeys: ArrayBuffer[],
    isTestnet: boolean
  ): DerivedAvalancheAddresses[]
}

interface DerivedSecp256k1Addresses {
  accountIndex: number
  evm: string
  btc: string
  avm: string
  pvm: string
  coreEth: string
}

interface DerivedAvalancheAddresses {
  x: string
  p: string
  coreEth: string
}
```

After updating the spec, run `yarn specs` to regenerate the Nitrogen bindings.

## Security

### Key material handling

Post-cleanup, the batched address-derivation surface is **pubkey-only**. No private keys, no BIP39 seed, no SLIP-0010 master cross the JS↔native boundary on these code paths. The remaining secret-material paths in `CryptoHybrid.cpp` (the signing-side `getPublicKeyFromString` / `getPublicKeyFromArrayBuffer` / `sign` / `signSchnorr` / `getExtendedPublicKey`) all wrap their secret-derived locals in `ScopeGuard` lambdas that call `OPENSSL_cleanse` on every exit path including exception unwind, and `signSchnorr` also cleanses the `secp256k1_keypair` struct (which internally stores the secret).

`getExtendedPublicKey` does **not** emit the secret-derived scalar across JSI — native returns an empty `scalar` field for ABI stability and the TS wrapper recomputes the bigint from the `head` bytes. Once a `std::string` crosses JSI, JS interns it in the engine heap with no API to zero it from C++.

### Input validation

- **Batch-size cap.** All five batched methods (`deriveAddressesFromXpubs` + the four per-chain encoders) reject `N > 1024` with `std::invalid_argument`. The synchronous per-chain encoders block the JS thread until they return; a buggy or hostile caller passing N=10k+ would freeze the UI for seconds without this guard. The JS wrappers in `Crypto.ts` enforce the same cap before crossing the bridge as defense-in-depth (`MAX_BATCH_SIZE = 1024`, throws `RangeError`).
- **Per-element length and prefix.** Each input pubkey is validated for byte length (33 for compressed secp256k1, 32 for Ed25519) and prefix byte (0x02 / 0x03 for compressed secp256k1) via `requireCompressedSecp256k1` / `abToVec`. Out-of-range bytes throw with the offending element index in the message.
- **Pair-array length.** `deriveAddressesForAvalanche` checks `avalanchePublicKeys.size() == evmPublicKeys.size()` before any work — mismatched arrays would otherwise silently produce wrong CoreEth addresses by zipping at the shorter length.
- **`parse_xpub`** whitelists BIP-32 version bytes (`xpub` / `tpub` only; explicit reject for `xprv` / `tprv` with a distinct error) and validates the SEC1 pubkey prefix byte (0x02 / 0x03). A malformed xpub could previously pass bytes `[45..78)` to `secp256k1_ec_pubkey_parse`, which can succeed on garbage and silently derive an attacker-influenced key tree.
- **`bech32_encode_raw`** rejects uppercase HRP characters instead of silently normalizing via `c | 0x20`, matching its documented contract.
- **`bech32_encode_segwit`** throws on `witness_version ≥ 1` with a message pointing at BIP-350/bech32m. The encoder only implements BIP-173; this guard prevents any future Taproot wiring from shipping invalid P2TR addresses.

### Side-channel protection

- secp256k1 context randomized with `RAND_bytes()` (OpenSSL CSPRNG) on first use, seed cleansed after. Protects against timing/power side-channel attacks on EC operations.

### Robustness

- `sha256()` and `ripemd160()` check `EVP_MD_CTX_new()` for null and verify all `EVP_Digest*` return values, freeing the context on every error path. Prevents silent incorrect hash outputs (which would produce wrong wallet addresses).
- `hmac_sha512` null-checks the OpenSSL `HMAC()` return. On allocator failure the prior code continued with a zeroed output buffer and produced a deterministic-but-wrong derivation with no error.
- `base58_map()` uses C++11 thread-safe static local initialization (lambda-initialized `std::array`) instead of a manual `bool` flag pattern that had a data race.

### Parallelism

- `deriveAddressesFromXpubs` parallelizes across `std::thread::hardware_concurrency()` worker threads via a shared `parallelFor` helper. libsecp256k1's const-context API is thread-safe for concurrent calls; OpenSSL EVP and HMAC calls each create their own context per invocation; shared master/xpub state is read-only inside the parallel region; each worker writes only to its own pre-allocated output slot.
- `parallelFor` catches `(...)` and rethrows via `std::exception_ptr` / `std::current_exception()` so foreign exceptions (e.g. Objective-C++ `NSException` on iOS) cannot escape a worker and call `std::terminate`. Exception type is preserved across the parallel boundary, so caller-side `catch (const std::invalid_argument&)` blocks still match the original throw site.
- The per-chain batched encoders are **serial** (no `parallelFor`). At their documented per-element cost (~30–80µs) the thread-spawn overhead of `parallelFor` (existing `kSmallBatchSerial = 2` heuristic) would actually slow N ≤ 20 batches. Serial is correct here.
- `CryptoHybrid.cpp` directly includes `<atomic>`, `<mutex>`, `<thread>`, `<utility>` (previously resolved only via transitive Nitro headers) so the translation unit stays self-contained across compilers and include orders.

### Build

- OpenSSL is a hard requirement on Android: CMake configure fails with remediation steps instead of falling back to a JS path that cannot run once the batch-derivation headers unconditionally include OpenSSL.

## Integration Points

### 1. Ledger offline discovery

**Files:**
- `packages/core-mobile/app/services/ledger/deriveAddressesOffline.ts`
- `packages/core-mobile/app/new/features/ledger/utils/discoverLedgerAccountsFromXpubs.ts`

`deriveAddressesBatch(evmXpub, avalancheXpubs, isTestnet, accountIndices)` calls `NativeCrypto.deriveAddressesFromXpubs` in a single async hop. The discovery loop in `discoverLedgerAccountsFromXpubs` passes the device-provided xpubs straight through — no per-index JS round-trip.

### 2. Mnemonic / seedless account discovery

**File:** `packages/core-mobile/app/services/account/AccountsService.tsx`

`discoverSeedBasedActiveAccounts` calls `ModuleManager.deriveAllAddresses({ accountIndices: windowIndices })` once per scan window. The discovery loop was simplified from the legacy `runWithConcurrency` per-account `deriveAddresses` pattern: no more `PromiseSettledResult<...>[]` ceremony, no per-account `'rejected'` branch in the activity-probe loop. A window-level derive failure sets `stoppedDueToError = true` and breaks the outer loop. Per-account isolation isn't meaningful for the realistic failure modes (wallet locked, factory unavailable) that fail every slot anyway.

`fillDiscoveredAccountGaps` collects every missing index in the contiguous range and makes one batched `deriveAllAddresses` call for all gaps. Most discoveries have zero gaps, so this loop is a no-op in the hot path; when gaps exist (e.g. transient 'unknown' activity probes leaving non-contiguous indices), it collapses N round-trips into 1.

### 3. Mnemonic / seedless `reloadAccounts`

**File:** `packages/core-mobile/app/services/account/AccountsService.tsx`

`reloadAccounts` collects all non-Ledger account indices into a single `ModuleManager.deriveAllAddresses` call before the per-account loop. The loop then just zips results by `accountIndex` and rebuilds each `Account`. The Ledger branch is unchanged — it plucks from `ledgerAddressesCollection` and never touches the native derive path.

Defensive checks at the boundary: throws if `batch.length !== accountEntries.length`, and throws inside the per-account loop if `derivedByIndex.get(account.index)` is undefined. Without these guards, a short batch would silently substitute `emptyAddresses()` and overwrite previously-correct BTC/AVM/PVM/SVM values (only the EVM substitution surfaces today via `resolveAddressC`'s Sentry log).

### 4. Single-account `getAddresses`

**File:** `packages/core-mobile/app/services/account/AccountsService.tsx`

`AccountsService.getAddresses` wraps `ModuleManager.deriveAllAddresses({ accountIndices: [accountIndex ?? 0] })` and returns `results[0]?.addresses ?? emptyAddresses()`. Single code path with the batched variant — sub-millisecond on the warm-cache path, not worth a fast path.

### 5. Solana support gate

**File:** `packages/core-mobile/app/services/account/AccountsService.tsx`

When `isSolanaSupportBlocked` is true in `discoverSeedBasedActiveAccounts`:
- `loadModuleByNetwork(NETWORK_SOLANA)` and `mapToVmNetwork(NETWORK_SOLANA)` are both skipped — `solanaModule` and `vmNetworks.solana` end up `undefined`.
- The secondary activity probe in `getSeedBasedActivityStatus` guards `if (modules.solanaModule && vmNetworks.solana)` before pushing the Solana probe — so the probe is skipped when the module is missing.
- SVM addresses are stripped from each window's results before they flow into `getSeedBasedBalanceActiveAccountIds`. Without this strip, the balance batch (which is flag-agnostic) would push a Solana namespace request based on the SVM addresses present in each `account.addresses` record.

## Performance characteristics

Measured via dev-only `moduleManagerDeriveBenchmark` (cold/warm cache pairs, N ∈ {1, 5, 10, 20, 50}) on a mnemonic wallet:

- **Cold (cache cleared)**: `ModuleManager.deriveAllAddresses` is ~2.3× faster than legacy `ModuleManager.deriveAddresses` × N, flat across N. The bottleneck in both is bip32 derivation in `WalletService.getPublicKeyFor` — that's the same work. The 2.3× gap is the JS-side overhead in the legacy path: vm-module dispatch, `Promise.allSettled` across four chains, JS-side bech32/keccak/base58 encoding per chain per account.
- **Warm (cache hit)**: `ModuleManager.deriveAllAddresses` is 160×–230× faster, growing with N. Per-account warm: legacy ≈ 22ms (JS-side encoding overhead unavoidable in vm-modules), batched ≈ 0.1ms (Map gets + native-only encoding).

Concrete: a 50-account `reloadAccounts` that used to take ~1.14s of JS-thread time now finishes in ~5ms.

## Testing

### Unit tests for native functions

- Derive addresses from known xpubs and verify against expected addresses (BIP32/BIP44 test vectors).
- Derive per-chain addresses from known pubkeys and verify against expected (EVM EIP-55, BTC P2WPKH bech32, Avalanche X/P/C bech32, Solana base58 Ed25519).
- Test with both mainnet and testnet parameters.
- Test with empty and large account index arrays (including the 1024 cap rejection).
- Test with invalid xpub strings (xprv/tprv, malformed SEC1 prefix, bad checksum) — should throw with a descriptive error, not crash.
- Test with malformed per-chain pubkeys (wrong length, wrong prefix byte) — should throw with the offending element index.
- Test that `deriveAddressesForAvalanche` rejects mismatched array lengths at the C++ boundary.

### Integration tests

- Verify that `ModuleManager.deriveAllAddresses` produces identical results to the legacy `ModuleManager.deriveAddresses` for the same `accountIndex`. Cover both EVM-only addresses and the full record across all six VM types.
- Run mnemonic account discovery with the batched path and verify the same accounts are discovered as the legacy per-account path.
- Run `reloadAccounts` with the batched path and verify all non-address `Account` fields are preserved.

### Performance validation

- `addressDerivationBenchmark.ts` — compares the legacy JS path (scenario A) against the per-chain native API path (scenarios B and C), across N ∈ {1, 5, 10, 20, 50, 100}.
- `moduleManagerDeriveBenchmark.ts` — compares `ModuleManager.deriveAddresses` vs `ModuleManager.deriveAllAddresses` in both cache states (A_cold / A_warm / B_cold / B_warm), with the pubkey cache explicitly cleared between paired runs.
- Verify the original repro: mnemonic login + Ledger onboarding simultaneously. The JS thread is no longer starved during discovery.

> Both benchmark files and their account-settings trigger buttons are dev-only (BENCH (cp14062-bench) marker in each header) and must be deleted before merging back. `WalletDerivedDataCache.clearPublicKeys` exists only for the benchmark's cold-cache measurements — drop it with them.

## Rollout

The migration shipped incrementally and is now complete:
1. ✅ Ledger offline derivation via `deriveAddressesFromXpubs` (simplest, self-contained).
2. ✅ Ledger discovery loop migrated to the batched API.
3. ✅ Per-chain native encoders (`deriveAddressesFor{Evm,Btc,Svm,Avalanche}`) added with array-based signatures.
4. ✅ `ModuleManager.deriveAllAddresses` orchestrator added; `AccountsService.getAddresses`, `discoverSeedBasedActiveAccounts` windowed loop, `fillDiscoveredAccountGaps`, and `reloadAccounts` migrated.
5. ✅ Solana support gating threaded through discovery (init skip + probe gate + SVM-address strip).
6. ✅ Unused seed-based native primitives removed (`deriveAllAddressesFromSeed`, `deriveAllAddressesFromPrivateKey`, `DerivedAllAddresses`, `slip0010.hpp`, `CleansingArray`, BIP32 private-key helpers).

## Out of Scope

- Moving BIP39 mnemonic-to-seed derivation (PBKDF2) to native — done once, cached, not a bottleneck.
- Changing VM module `deriveAddress()` — these are external packages; the orchestrator bypasses them for the batched path while the single-account `deriveAddresses` remains available on `ModuleManager` for any caller that still needs the legacy semantics.
- Async (Promise-returning) variants of the four per-chain encoders. They block the JS thread today, but at documented per-element cost (~30–80µs) and the 1024 cap, that's bounded. A future caller wanting N >> 50 in a tight loop could move them to `Promise::async` with no API change.
- Solana derivation for Ledger wallets — Ledger provides Solana addresses via APDU.
