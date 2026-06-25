/**
 * 10% of the gross estimated delegation rewards charged as a convenience fee
 * for Fast Stake transactions. Mirrors the rate used by core-web (see
 * `apps/core/app/components/Stake/constants.ts`) so both clients quote the
 * user the same effective APY.
 */
export const FAST_STAKE_FEE_RATE = 0.1

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
