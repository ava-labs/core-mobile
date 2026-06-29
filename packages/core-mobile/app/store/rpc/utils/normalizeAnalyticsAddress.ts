/**
 * Canonicalize an address for the dApp-transaction analytics lifecycle so the
 * same signer is reported identically across `_success` / `_confirmed` /
 * `_failed`, regardless of where each event sources the address.
 *
 * EVM (hex) addresses can arrive in different casings: `_success` for
 * `eth_sendTransaction` uses the dApp-supplied tx `from` verbatim (whatever
 * EIP-55 / lowercase form the dApp chose), while the wallet-derived address
 * (`account.addressC`) and the WalletConnect path may differ. Hex addresses are
 * case-insensitive, so we lowercase them to a single canonical form — preventing
 * a case-sensitive `distinct(address)` downstream (e.g. MTU unique-transactor
 * counts) from splitting one signer into two. CP-13825.
 *
 * Non-hex addresses are case-sensitive and/or already canonical and MUST NOT be
 * lowercased: Bitcoin base58 (P2PKH/P2SH) and Solana base58 encode information in
 * case, and Avalanche X/P bech32 is already lowercase. These are returned as-is.
 * The `0x`/`0X` prefix uniquely identifies EVM hex here: base58 never contains a
 * `0`, and every bech32 form (`bc1`/`tb1`/`X-`/`P-`/`avax1`) starts otherwise.
 *
 * Note: the WalletConnect `solana_signTransaction_approved` event intentionally
 * does NOT pass through here — it carries an SVM (case-sensitive base58) address
 * and has no paired `_confirmed`/`_failed` to stay consistent with.
 */
export const normalizeAnalyticsAddress = (address: string): string =>
  /^0x/i.test(address) ? address.toLowerCase() : address
