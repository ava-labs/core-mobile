import type { Wallet } from './types'

/**
 * Centralized cache for expensive wallet derivation operations.
 * Persists across wallet instance lifecycles to prevent redundant
 * cryptographic operations like public key derivation, xpub generation,
 * and wallet instance creation (keychain reads + seed derivation).
 *
 * Uses nested Maps keyed by walletId for O(1) per-wallet clearing.
 */
export class WalletDerivedDataCache {
  // walletId -> "derivationPath:curve" -> publicKey
  private publicKeyCache = new Map<string, Map<string, string>>()
  // walletId -> accountIndex -> xpub
  private xpubCache = new Map<string, Map<number, string>>()
  private walletInstanceCache = new Map<string, Wallet>()
  private walletCreationInFlight = new Map<string, Promise<Wallet>>()

  getPublicKey(
    walletId: string,
    derivationPath: string,
    curve: string
  ): string | undefined {
    return this.publicKeyCache.get(walletId)?.get(`${derivationPath}:${curve}`)
  }

  setPublicKey(
    walletId: string,
    derivationPath: string,
    curve: string,
    publicKey: string
  ): void {
    let walletMap = this.publicKeyCache.get(walletId)
    if (!walletMap) {
      walletMap = new Map()
      this.publicKeyCache.set(walletId, walletMap)
    }
    walletMap.set(`${derivationPath}:${curve}`, publicKey)
  }

  getXpub(walletId: string, accountIndex: number): string | undefined {
    return this.xpubCache.get(walletId)?.get(accountIndex)
  }

  setXpub(walletId: string, accountIndex: number, xpub: string): void {
    let walletMap = this.xpubCache.get(walletId)
    if (!walletMap) {
      walletMap = new Map()
      this.xpubCache.set(walletId, walletMap)
    }
    walletMap.set(accountIndex, xpub)
  }

  getWalletInstance(walletId: string): Wallet | undefined {
    return this.walletInstanceCache.get(walletId)
  }

  setWalletInstance(walletId: string, wallet: Wallet): void {
    this.walletInstanceCache.set(walletId, wallet)
  }

  getWalletCreationInFlight(walletId: string): Promise<Wallet> | undefined {
    return this.walletCreationInFlight.get(walletId)
  }

  setWalletCreationInFlight(walletId: string, promise: Promise<Wallet>): void {
    this.walletCreationInFlight.set(walletId, promise)
    // Clean up in-flight entry once settled. The .catch suppresses the
    // unhandled rejection on this detached chain — callers still receive
    // the rejection through the original promise they await.
    promise
      .finally(() => {
        if (this.walletCreationInFlight.get(walletId) === promise) {
          this.walletCreationInFlight.delete(walletId)
        }
      })
      .catch(() => undefined)
  }

  clearWallet(walletId: string): void {
    this.publicKeyCache.delete(walletId)
    this.xpubCache.delete(walletId)
    this.walletInstanceCache.delete(walletId)
    this.walletCreationInFlight.delete(walletId)
  }

  // Clear only the derived pubkey/xpub caches for a wallet, leaving the
  // wallet instance intact. Useful for measurements that want a cold
  // derivation cache without paying the one-time cost of re-decrypting
  // the mnemonic from biometrics.
  clearPublicKeys(walletId: string): void {
    this.publicKeyCache.delete(walletId)
    this.xpubCache.delete(walletId)
  }

  clearAll(): void {
    this.publicKeyCache.clear()
    this.xpubCache.clear()
    this.walletInstanceCache.clear()
    this.walletCreationInFlight.clear()
  }

  getStats(): {
    publicKeyCount: number
    xpubCount: number
    walletInstanceCount: number
  } {
    let publicKeyCount = 0
    for (const walletMap of this.publicKeyCache.values()) {
      publicKeyCount += walletMap.size
    }
    let xpubCount = 0
    for (const walletMap of this.xpubCache.values()) {
      xpubCount += walletMap.size
    }
    return {
      publicKeyCount,
      xpubCount,
      walletInstanceCount: this.walletInstanceCache.size
    }
  }
}

/** Module-level singleton — shared by WalletFactory and importable without pulling in the full wallet dependency tree. */
export const walletDerivedDataCache = new WalletDerivedDataCache()
