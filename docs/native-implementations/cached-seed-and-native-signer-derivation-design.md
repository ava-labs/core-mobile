# Cached Seed & Native Signer Derivation

**Ticket:** TBD  
**Date:** 2026-04-29  
**Status:** Draft  
**Depends on:** CP-14062 (native batch address derivation)

## Problem

Every transaction signing path in `MnemonicWallet` re-derives the BIP39 seed from the mnemonic via PBKDF2 (2048 rounds of HMAC-SHA512). This blocks the JS thread for ~50-200ms on each sign, send, or message approval — even though the mnemonic never changes during a session.

The PBKDF2 cost is incurred because each signer factory takes the raw mnemonic string and internally calls `mnemonicToSeedSync`:

| Signer | Factory | PBKDF2 source |
|--------|---------|---------------|
| EVM | `getWalletFromMnemonic(mnemonic)` | ethers `HDNodeWallet.fromMnemonic` (internal) |
| BTC | `BitcoinWallet.fromMnemonic(mnemonic)` | internal PBKDF2 |
| Avalanche | `new Avalanche.SimpleSigner(mnemonic)` | `mnemonicToSeedSync` in constructor |
| Solana | `mnemonicToSeedSync(mnemonic)` | explicit call in `getSvmSigner` |
| Public key | `mnemonicToSeed(mnemonic)` | explicit call in `getPublicKeyFor` |

The repro is: sign any transaction on a mnemonic wallet and observe the JS thread blocked for the duration of PBKDF2. On slower devices this is noticeable as a brief UI freeze before the transaction confirmation dialog appears.

## Solution

### Part 1: Cache the BIP39 seed in MnemonicWallet

Derive the 64-byte seed once on first use and cache it for the lifetime of the wallet instance. All subsequent signer creations use the cached seed, eliminating repeated PBKDF2.

```typescript
export class MnemonicWallet implements Wallet {
  #mnemonic?: string
  #cachedSeed?: Buffer

  private getSeed(): Buffer {
    if (!this.#cachedSeed) {
      this.#cachedSeed = mnemonicToSeedSync(this.mnemonic)
    }
    return this.#cachedSeed
  }
}
```

**Security:** The cached seed lives in JS heap memory alongside `this.#mnemonic`, which is already stored as a plaintext string. The seed is strictly less sensitive than the mnemonic (the mnemonic can regenerate the seed, not vice versa). Caching does not change the threat model. The seed should be cleared when the wallet is locked or destroyed.

### Part 2: Bypass mnemonic-taking SDK functions

Replace each signer factory to use the cached seed instead of the mnemonic string, bypassing the SDK's internal PBKDF2.

#### EVM signer

**Before:**
```typescript
private getEvmSigner(accountIndex: number): BaseWallet {
  return getWalletFromMnemonic(this.mnemonic, accountIndex, DerivationPath.BIP44)
}
```

**After:**
```typescript
private getEvmSigner(accountIndex: number): BaseWallet {
  const path = getEVMDerivationPath(accountIndex, DerivationPath.BIP44)
  return HDNodeWallet.fromSeed(this.getSeed()).derivePath(path)
}
```

`HDNodeWallet.fromSeed()` accepts raw seed bytes and performs only BIP32 derivation (~1ms), skipping PBKDF2 entirely. The `getEVMDerivationPath` helper constructs the BIP44 path string (e.g. `m/44'/60'/0'/0/0`).

#### BTC signer

**Before:**
```typescript
private async getBtcSigner(accountIndex: number, provider: BitcoinProvider) {
  return await BitcoinWallet.fromMnemonic(this.mnemonic, accountIndex, provider)
}
```

**After:**
```typescript
private getBtcSigner(accountIndex: number, provider: BitcoinProvider) {
  const path = getBTCDerivationPath(accountIndex, DerivationPath.BIP44)
  const hdNode = HDNodeWallet.fromSeed(this.getSeed()).derivePath(path)
  return BitcoinWallet.fromEthersWallet(hdNode, provider)
}
```

The SDK provides `BitcoinWallet.fromEthersWallet(hdNode, provider)` which accepts a pre-derived `HDNodeWallet` and skips mnemonic parsing.

#### Solana signer

**Before:**
```typescript
private getSvmSigner(accountIndex: number): SolanaSigner {
  const seed = mnemonicToSeedSync(this.mnemonic)      // PBKDF2 (~100ms)
  const node = slip10.fromMasterSeed(Uint8Array.from(seed))
  const path = ...
  const pkey = node.derive(path)
  return new SolanaSigner(Buffer.from(pkey.privateKey))
}
```

**After (cached seed):**
```typescript
private getSvmSigner(accountIndex: number): SolanaSigner {
  const node = slip10.fromMasterSeed(Uint8Array.from(this.getSeed()))
  const path = ...
  const pkey = node.derive(path)
  return new SolanaSigner(Buffer.from(pkey.privateKey))
}
```

This eliminates PBKDF2. The remaining SLIP-0010 derivation is 5 HMAC-SHA512 calls (~2ms).

#### Avalanche signer

**Current:** `new Avalanche.SimpleSigner(mnemonic, accountIndex)` calls `mnemonicToSeedSync` internally in the SDK constructor. **Cannot bypass without SDK changes.**

**Options:**
1. **SDK change (preferred):** Add a `SimpleSigner.fromSeed(seed, accountIndex)` constructor to `@avalabs/core-wallets-sdk` that accepts a pre-derived seed.
2. **Custom signer:** Reconstruct the BIP32 nodes from the cached seed and build a compatible signer object that implements the same `signTx`/`signMessage` interface.
3. **Leave as-is:** Accept the ~100ms PBKDF2 cost for Avalanche X/P signing. This path is used less frequently than EVM/Solana.

**Recommendation:** File an issue on `core-wallets-sdk` for option 1. Implement option 3 (leave as-is) in this PR, revisit when the SDK supports it.

#### getPublicKeyFor

**Before:**
```typescript
const seed = await mnemonicToSeed(this.mnemonic)
```

**After:**
```typescript
const seed = this.getSeed()
```

### Part 3 (optional): Native SLIP-0010 private key derivation for Solana signing

The C++ `slip0010.hpp` in `react-native-nitro-avalabs-crypto` already implements the full SLIP-0010 Ed25519 derivation path. A new native function could return the derived Ed25519 private key (not just the address), moving all Solana signer derivation off the JS thread.

#### API

```typescript
// New Nitro spec addition
deriveSolanaSignerFromSeed(
  seed: ArrayBuffer,
  accountIndex: number
): Promise<ArrayBuffer>  // 32-byte Ed25519 private key
```

#### C++ implementation

```cpp
// In CryptoHybrid.cpp — reuses existing slip0010.hpp
auto derived = slip0010_derive_path(master, {44, 501, account_index, 0});
// Return derived.secret as ArrayBuffer (32 bytes)
// OPENSSL_cleanse master after use
```

#### Integration

```typescript
private async getSvmSigner(accountIndex: number): Promise<SolanaSigner> {
  const seedBuffer = this.getSeed().buffer.slice(...) as ArrayBuffer
  const privateKey = await deriveSolanaSignerFromSeed(seedBuffer, accountIndex)
  return new SolanaSigner(Buffer.from(privateKey))
}
```

**Security:** The private key crosses the native→JS boundary, but it ends up in JS memory either way (the current JS path creates it in JS). The native function should `OPENSSL_cleanse` all intermediate key material. The returned ArrayBuffer contains the raw Ed25519 secret and should be zeroed after `SolanaSigner` construction.

**Trade-off:** This is a small incremental win (~2ms → ~0ms for SLIP-0010) on top of the seed caching (~100ms → ~2ms). The main value is consistency — all crypto derivation happens in native C++. Consider implementing only if the Solana signing path is performance-sensitive.

## Impact

| Path | Before (per sign) | After (cached seed) | After (+ native SLIP-0010) |
|------|-------------------|---------------------|---------------------------|
| EVM | ~100ms | ~1ms | ~1ms |
| BTC | ~100ms | ~1ms | ~1ms |
| Solana | ~100ms | ~2ms | ~0ms (native thread) |
| Avalanche | ~100ms | ~100ms (SDK limitation) | ~100ms |
| `getPublicKeyFor` | ~100ms | ~1-2ms | ~1-2ms |

## Scope

### In scope
- Cache BIP39 seed in `MnemonicWallet` (Part 1)
- Bypass mnemonic-taking factories for EVM, BTC, Solana (Part 2)
- Clear cached seed on wallet lock/destroy
- Unit tests verifying addresses match between cached and uncached paths

### Out of scope (follow-up)
- `SimpleSigner.fromSeed()` SDK change for Avalanche (requires `@avalabs/core-wallets-sdk` PR)
- Native SLIP-0010 private key derivation (Part 3 — optional, small incremental win)
- Caching derived signers themselves (diminishing returns; BIP32 from seed is ~1ms)

## Files to modify

| File | Change |
|------|--------|
| `app/services/wallet/MnemonicWallet.ts` | Add `#cachedSeed`, `getSeed()`, update all signer factories |
| `app/services/wallet/MnemonicWallet.ts` | Clear `#cachedSeed` alongside `#mnemonic` in setter |

### If Part 3 is implemented:
| File | Change |
|------|--------|
| `src/specs/Crypto.nitro.ts` | Add `deriveSolanaSignerFromSeed` spec |
| `cpp/CryptoHybrid.cpp` | Implement native function using existing `slip0010.hpp` |
| `src/Crypto.ts` | Add JS wrapper |

## Testing

1. Sign an EVM transaction — verify signature is valid and JS thread is not blocked
2. Sign a BTC transaction — verify signature is valid
3. Sign a Solana transaction — verify signature is valid
4. Sign an Avalanche X/P transaction — verify still works (unchanged path)
5. Sign a message (personalSign, signTypedData, Avalanche, Solana) — verify signatures match
6. Verify derived addresses from cached seed match addresses from uncached `mnemonicToSeedSync`
7. Lock and re-unlock wallet — verify cached seed is cleared and re-derived
8. Measure JS thread block time before/after on a real device
