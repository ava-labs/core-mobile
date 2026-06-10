import { PChainTransaction } from '@avalabs/glacier-sdk'
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'
import {
  FAST_STAKE_FEE_ESCROW_ADDRESS_FUJI,
  FAST_STAKE_FEE_ESCROW_ADDRESS_MAINNET
} from '../constants'

/**
 * Returns true if the transaction has an emitted UTXO addressed to the
 * fast-stake fee escrow account, which is the on-chain signal that this
 * delegation was placed via the Fast Stake flow.
 *
 * Mirrors `isFastStakeTx` from core-web (`apps/core/app/components/Stake/
 * utils/isFastStakeTx.ts`). Glacier returns UTXO `addresses` without the
 * `P-` / `C-` / `X-` chain prefix, while the escrow constants include it;
 * we strip both sides defensively so the comparison stays correct if the
 * shape ever changes upstream.
 */
export const isFastStakeTx = (
  tx: PChainTransaction,
  isTestnet: boolean
): boolean => {
  const escrowAddress = stripAddressPrefix(
    isTestnet
      ? FAST_STAKE_FEE_ESCROW_ADDRESS_FUJI
      : FAST_STAKE_FEE_ESCROW_ADDRESS_MAINNET
  )
  return tx.emittedUtxos.some(utxo =>
    utxo.addresses.some(addr => stripAddressPrefix(addr) === escrowAddress)
  )
}
