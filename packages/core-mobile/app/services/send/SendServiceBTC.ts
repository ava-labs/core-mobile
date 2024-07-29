import { BITCOIN_NETWORK, BITCOIN_TEST_NETWORK } from '@avalabs/core-chains-sdk'
import {
  BitcoinInputUTXO,
  BitcoinOutputUTXO,
  createTransferTx,
  getMaxTransferAmount
} from '@avalabs/core-wallets-sdk'
import {
  SendErrorMessage,
  SendServiceHelper,
  SendState,
  ValidateStateAndCalculateFeesParams
} from 'services/send/types'

// singleton services
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import { isBtcAddress } from 'utils/isBtcAddress'
import type { TokenWithBalanceBTC } from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

class SendServiceBTC implements SendServiceHelper {
  async getTransactionRequest(
    params: ValidateStateAndCalculateFeesParams
  ): Promise<{
    inputs: BitcoinInputUTXO[]
    outputs: BitcoinOutputUTXO[]
  }> {
    const { sendState, isMainnet, fromAddress, currency, sentryTrx } = params
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.btc.get_trx_request')
      .executeAsync(async () => {
        const { address: toAddress, amount } = sendState
        const feeRate = Number(sendState.defaultMaxFeePerGas)
        const provider = getBitcoinProvider(!isMainnet)
        const { utxos } = await this.getBalance({
          isMainnet,
          address: fromAddress,
          currency: currency || '',
          sentryTrx
        })

        const { inputs, outputs } = createTransferTx(
          toAddress || '',
          fromAddress,
          Number(amount ?? 0),
          feeRate || 0,
          utxos,
          provider.getNetwork()
        )

        if (!inputs || !outputs) {
          throw new Error('Unable to create transaction')
        }

        return { inputs, outputs }
      })
  }

  async validateStateAndCalculateFees(
    params: ValidateStateAndCalculateFeesParams
  ): Promise<SendState> {
    const { sendState, isMainnet, fromAddress, currency, sentryTrx } = params
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.btc.validate_and_calc_fees')
      .executeAsync(async () => {
        const { amount, address: toAddress, defaultMaxFeePerGas } = sendState
        const feeRate = Number(defaultMaxFeePerGas)
        const amountInSatoshis = amount ?? 0n
        const { utxos } = await this.getBalance({
          isMainnet,
          address: fromAddress,
          currency: currency || '',
          sentryTrx
        })
        const provider = getBitcoinProvider(!isMainnet)

        if (!defaultMaxFeePerGas || defaultMaxFeePerGas === 0n)
          return this.getErrorState(
            {
              ...sendState
            },
            SendErrorMessage.INVALID_NETWORK_FEE
          )

        // Estimate max send amount based on UTXOs and fee rate
        // Since we are only using bech32 addresses we can use this.address to estimate
        const maxAmount = BigInt(
          Math.max(
            getMaxTransferAmount(utxos, fromAddress, fromAddress, feeRate),
            0
          )
        )

        if (!toAddress)
          return this.getErrorState(
            {
              ...sendState,
              maxAmount
            },
            SendErrorMessage.ADDRESS_REQUIRED
          )

        // Validate the destination address
        const isAddressValid = isBtcAddress(toAddress, isMainnet)

        if (!isAddressValid)
          return this.getErrorState(
            { ...sendState, canSubmit: false, maxAmount },
            SendErrorMessage.INVALID_ADDRESS
          )

        const { fee, psbt } = createTransferTx(
          toAddress,
          fromAddress,
          Number(amountInSatoshis),
          feeRate,
          utxos,
          provider.getNetwork()
        )

        const newState: SendState = {
          ...sendState,
          canSubmit: !!psbt,
          error: undefined,
          maxAmount,
          sendFee: BigInt(fee),
          // The transaction's byte size is for BTC as gasLimit is for EVM.
          // Bitcoin's formula for fee is `transactionByteLength * feeRate`.
          // Since we know the `fee` and the `feeRate`, we can get the transaction's
          // byte length by division.
          gasLimit: fee / feeRate
        }

        if (!amountInSatoshis)
          return this.getErrorState(newState, SendErrorMessage.AMOUNT_REQUIRED)

        if (!psbt && amountInSatoshis > 0)
          return this.getErrorState(
            newState,
            SendErrorMessage.INSUFFICIENT_BALANCE
          )

        return newState
      })
  }

  private async getBalance({
    isMainnet,
    address,
    currency,
    sentryTrx
  }: {
    isMainnet: boolean
    address: string
    currency: string
    sentryTrx?: Transaction
  }): Promise<{
    balance: bigint
    utxos: BitcoinInputUTXO[]
  }> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.balance.btc.get')
      .executeAsync(async () => {
        const provider = getBitcoinProvider(!isMainnet)
        const network = isMainnet ? BITCOIN_NETWORK : BITCOIN_TEST_NETWORK
        const balancesResponse = await ModuleManager.bitcoinModule.getBalances({
          addresses: [address],
          currency,
          network: mapToVmNetwork(network)
        })
        const balances = Object.values(balancesResponse[address] ?? [])

        const utxos = (balances?.[0] as TokenWithBalanceBTC)?.utxos || []
        const utxosWithScripts = await provider.getScriptsForUtxos(utxos)

    return {
      balance: balances?.[0]?.balance || 0n,
      utxos: utxosWithScripts
    }})
  }

  private getErrorState(sendState: SendState, errorMessage: string): SendState {
    return {
      ...sendState,
      error: { error: true, message: errorMessage },
      canSubmit: false
    }
  }
}

export default new SendServiceBTC()
