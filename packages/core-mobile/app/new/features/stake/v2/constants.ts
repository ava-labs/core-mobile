// The convenience-fee rates are no longer compiled in here: the
// `fast-stake-fee-enabled` / `delegation-fee-enabled` gates are multivariate
// and their variant string carries the rate in basis points. See
// `selectFastStakeFeeRate` / `selectDelegationFeeRate` in `store/posthog`
// (both default to 10%, the rate core-web still hardcodes). The fee basis is
// unchanged: the rate applies to the NET estimated rewards, after the
// validator's own delegation fee.

/**
 * Core-owned, P-Chain escrow address the convenience fee is paid to on
 * mainnet. Mirrors core-web. If this ever needs to change, update both
 * platforms in lockstep and consider also updating `isFastStakeTx` to
 * recognise the prior address so historical Fast Stake transactions keep
 * their badge.
 */
export const FAST_STAKE_FEE_ESCROW_ADDRESS_MAINNET =
  'P-avax1qhxnrs9qwd2tyftl0yjscsy6n90gqrd8j3fk0t'

/**
 * Fuji counterpart of {@link FAST_STAKE_FEE_ESCROW_ADDRESS_MAINNET}.
 */
export const FAST_STAKE_FEE_ESCROW_ADDRESS_FUJI =
  'P-fuji1tdu6cekp82sctyykhnl5snskeertua3vz63tyn'

/**
 * Returns the escrow address that the Fast Stake convenience fee should be
 * sent to for the given network environment. Centralised so both the
 * outgoing transaction (in `useDelegation.delegate`) and the chain-side
 * detection (in `isFastStakeTx`) read the same source.
 */
export const getFastStakeFeeEscrowAddress = (isTestnet: boolean): string =>
  isTestnet
    ? FAST_STAKE_FEE_ESCROW_ADDRESS_FUJI
    : FAST_STAKE_FEE_ESCROW_ADDRESS_MAINNET

/**
 * Core-owned, P-Chain escrow address the advanced delegate service fee is paid
 * to on mainnet. Distinct from the Fast Stake escrow so the two fee streams
 * can be accounted for separately. Mirrors core-web.
 */
export const DELEGATION_FEE_ESCROW_ADDRESS_MAINNET =
  'P-avax15e4vzdau3hgnk9a95xaj7q33l26rrzju9ttj63'

/**
 * Fuji counterpart of {@link DELEGATION_FEE_ESCROW_ADDRESS_MAINNET}. On testnet
 * this shares the Fast Stake escrow address (mirrors core-web).
 */
export const DELEGATION_FEE_ESCROW_ADDRESS_FUJI =
  FAST_STAKE_FEE_ESCROW_ADDRESS_FUJI

/**
 * Returns the escrow address that the advanced delegate service fee should be
 * sent to for the given network environment. Mirrors
 * {@link getFastStakeFeeEscrowAddress} for the delegate program.
 */
export const getDelegationFeeEscrowAddress = (isTestnet: boolean): string =>
  isTestnet
    ? DELEGATION_FEE_ESCROW_ADDRESS_FUJI
    : DELEGATION_FEE_ESCROW_ADDRESS_MAINNET
