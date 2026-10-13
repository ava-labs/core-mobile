// Thrown by EvmSigner.signBatch when the active wallet cannot return signed
// transactions without a per-tx approval (hardware / WalletConnect). The Fusion
// SDK catches it and, with `fallbackToDefaultOnBatchFailure: true`, re-issues
// the transactions one-by-one through the single-tx signing path.
export class BatchSigningUnsupportedError extends Error {
  readonly isBatchSigningUnsupported = true as const
  constructor(walletType: string) {
    super(`Batch signing is not supported for wallet type: ${walletType}`)
    this.name = 'BatchSigningUnsupportedError'
  }
}

export const isBatchSigningUnsupportedError = (
  err: unknown
): err is BatchSigningUnsupportedError =>
  typeof err === 'object' &&
  err !== null &&
  (err as { isBatchSigningUnsupported?: boolean }).isBatchSigningUnsupported ===
    true
