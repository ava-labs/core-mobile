import { ErrorBase } from 'errors/ErrorBase'

export enum KeystoneErrors {
  UNSUPPORTED_XP_DERIVATION = 'UNSUPPORTED_XP_DERIVATION'
}

export class KeystoneWalletError extends ErrorBase<KeystoneErrors> {}

/**
 * Keystone QR wallets carry only the depth-3 account-0 X/P xpub
 * (`m/44'/9000'/0'`), so they cannot derive per-account X/P paths
 * (`m/44'/9000'/N'/0/0` for N > 0). This predicate flags that specific,
 * structurally-unsupported case so address derivation can create the account
 * with empty X/P addresses instead of failing closed (CP-14606).
 *
 * Matched by `name` on any error-like object rather than via `instanceof` so
 * the check still holds if the rejection reason was wrapped, re-thrown, or
 * serialized into a plain object while crossing the vm-module package boundary.
 */
export const isUnsupportedXpDerivationError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { name?: unknown }).name ===
    KeystoneErrors.UNSUPPORTED_XP_DERIVATION
