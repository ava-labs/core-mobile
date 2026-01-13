/**
 * Centralized cache for expensive wallet derivation operations.
 * Persists across wallet instance lifecycles to prevent redundant
 * cryptographic operations like public key derivation and xpub generation.
 */
export class WalletDerivedDataCache {
  private publicKeyCache = new Map<string, string>()
  private xpubCache = new Map<string, string>()

  /**
   * Get cached public key for a wallet's derivation path and curve
   */
  getPublicKey(
    walletId: string,
    derivationPath: string,
    curve: string
  ): string | undefined {
    const key = this.buildPublicKeyKey(walletId, derivationPath, curve)
    return this.publicKeyCache.get(key)
  }

  /**
   * Cache a public key for a wallet's derivation path and curve
   */
  setPublicKey(
    walletId: string,
    derivationPath: string,
    curve: string,
    publicKey: string
  ): void {
    const key = this.buildPublicKeyKey(walletId, derivationPath, curve)
    this.publicKeyCache.set(key, publicKey)
  }

  /**
   * Get cached extended public key (xpub) for a wallet's account index
   */
  getXpub(walletId: string, accountIndex: number): string | undefined {
    const key = this.buildXpubKey(walletId, accountIndex)
    return this.xpubCache.get(key)
  }

  /**
   * Cache an extended public key (xpub) for a wallet's account index
   */
  setXpub(walletId: string, accountIndex: number, xpub: string): void {
    const key = this.buildXpubKey(walletId, accountIndex)
    this.xpubCache.set(key, xpub)
  }

  /**
   * Clear all cached data for a specific wallet
   */
  clearWallet(walletId: string): void {
    const prefix = `${walletId}:`

    for (const key of this.publicKeyCache.keys()) {
      if (key.startsWith(prefix)) {
        this.publicKeyCache.delete(key)
      }
    }

    for (const key of this.xpubCache.keys()) {
      if (key.startsWith(prefix)) {
        this.xpubCache.delete(key)
      }
    }
  }

  /**
   * Clear all cached data
   */
  clearAll(): void {
    this.publicKeyCache.clear()
    this.xpubCache.clear()
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): {
    publicKeyCount: number
    xpubCount: number
  } {
    return {
      publicKeyCount: this.publicKeyCache.size,
      xpubCount: this.xpubCache.size
    }
  }

  private buildPublicKeyKey(
    walletId: string,
    derivationPath: string,
    curve: string
  ): string {
    return `${walletId}:${derivationPath}:${curve}`
  }

  private buildXpubKey(walletId: string, accountIndex: number): string {
    return `${walletId}:${accountIndex}`
  }
}
