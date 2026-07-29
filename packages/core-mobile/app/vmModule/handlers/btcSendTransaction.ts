import { Network } from '@avalabs/core-chains-sdk'
import {
  ApprovalResponse,
  BitcoinExecuteTxData
} from '@avalabs/vm-module-types'
import WalletService from 'services/wallet/WalletService'
import { rpcErrors } from '@metamask/rpc-errors'
import { Account } from 'store/account/types'
import { BtcTransactionRequest, WalletType } from 'services/wallet/types'
import { BitcoinInputUTXO, createTransferTx } from '@avalabs/core-wallets-sdk'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

const MAX_BTC_FEE_RATE = 10_000

// Validate the shape of each UTXO A UTXO missing `script` (or with malformed numeric fields) must be rejected
const isValidInputUtxo = (utxo: unknown): utxo is BitcoinInputUTXO => {
  if (!utxo || typeof utxo !== 'object') return false
  const u = utxo as Record<string, unknown>
  return (
    typeof u.txHash === 'string' &&
    u.txHash.length > 0 &&
    typeof u.script === 'string' &&
    u.script.length > 0 &&
    typeof u.index === 'number' &&
    Number.isInteger(u.index) &&
    u.index >= 0 &&
    typeof u.value === 'number' &&
    Number.isInteger(u.value) &&
    u.value >= 0 &&
    typeof u.blockHeight === 'number' &&
    typeof u.confirmations === 'number'
  )
}

// Rebuild the transaction for a changed fee rate 
const rebuildTxForFeeRate = async ({
  transactionData,
  network,
  account,
  finalFeeRate
}: {
  transactionData: BitcoinExecuteTxData
  network: Network
  account: Account
  finalFeeRate: number
}): Promise<BtcTransactionRequest> => {
  const { to, amount, balance } = transactionData

  // Bound the (attacker/UI-influenced) fee rate before constructing a new tx.
  if (
    !Number.isInteger(finalFeeRate) ||
    finalFeeRate < 0 ||
    finalFeeRate > MAX_BTC_FEE_RATE
  ) {
    throw new Error('Invalid fee rate')
  }

  // Validate the UTXO set shape rather than an unchecked cast. filter with the
  // type guard narrows to BitcoinInputUTXO[] (no cast) and lets us reject if
  // anything was dropped.
  const rawUtxos = balance.utxos
  if (!Array.isArray(rawUtxos) || rawUtxos.length === 0) {
    throw new Error('Invalid UTXO set')
  }
  const sourceUtxos = rawUtxos.filter(isValidInputUtxo)
  if (sourceUtxos.length !== rawUtxos.length) {
    throw new Error('Invalid UTXO set')
  }

  const provider = await ModuleManager.bitcoinModule.getProvider(
    mapToVmNetwork(network)
  )
  const updatedTx = createTransferTx(
    to,
    account.addressBTC,
    amount,
    finalFeeRate,
    sourceUtxos,
    provider.getNetwork()
  )

  if (!updatedTx.inputs || !updatedTx.outputs) {
    throw new Error('Unable to create transaction')
  }

  // The rebuilt tx must still pay the approved destination the approved amount.
  // Reject if the recipient output drifted (only the change output may differ
  // after a fee change).
  const paysApprovedRecipient = updatedTx.outputs.some(
    output => output.address === to && output.value === amount
  )
  if (!paysApprovedRecipient) {
    throw new Error(
      'Recreated transaction does not match the approved destination/amount'
    )
  }

  return { inputs: updatedTx.inputs, outputs: updatedTx.outputs }
}

export const btcSendTransaction = async ({
  transactionData,
  network,
  account,
  finalFeeRate,
  walletId,
  walletType,
  resolve
}: {
  transactionData: BitcoinExecuteTxData
  network: Network
  account: Account
  finalFeeRate: number
  walletId: string
  walletType: WalletType
  resolve: (value: ApprovalResponse) => void
}): Promise<void> => {
  const { feeRate, inputs, outputs } = transactionData

  try {
    // we need to re-create the transaction when fee rate has changed
    const transaction: BtcTransactionRequest =
      finalFeeRate !== 0 && finalFeeRate !== feeRate
        ? await rebuildTxForFeeRate({
            transactionData,
            network,
            account,
            finalFeeRate
          })
        : { inputs, outputs }

    const signedTx = await WalletService.sign({
      walletId,
      walletType,
      transaction,
      accountIndex: account.index,
      accountName: account.name,
      network
    })

    resolve({
      signedData: signedTx
    })
  } catch (error) {
    resolve({
      error: rpcErrors.internal({
        message: 'Failed to sign btc transaction',
        data: { cause: error }
      })
    })
  }
}
