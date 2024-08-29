import {
  BitcoinInputUTXO,
  getMaxTransferAmount
} from '@avalabs/core-wallets-sdk'
import {
  SendErrorMessage,
  SendServiceHelper,
  SendState,
  ValidateStateAndCalculateFeesParams
} from 'services/send/types'
import {
  getBitcoinNetwork,
  getBitcoinProvider
} from 'services/network/utils/providerUtils'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import { isBtcAddress } from 'utils/isBtcAddress'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'

class SendServiceBTC implements SendServiceHelper {
  async validateStateAndCalculateFees(
    params: ValidateStateAndCalculateFeesParams
  ): Promise<SendState> {
    const { sendState, isMainnet, fromAddress, sentryTrx, utxos } = params

    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.btc.validate_and_calc_fees')
      .executeAsync(async () => {
        const {
          amount,
          address: toAddress,
          defaultMaxFeePerGas,
          token
        } = sendState

        // Set canSubmit to false if token/address is not set
        if (!token || !toAddress) return this.getErrorState(sendState, '')

        if (!defaultMaxFeePerGas || defaultMaxFeePerGas === 0n)
          return this.getErrorState(
            sendState,
            SendErrorMessage.INVALID_NETWORK_FEE
          )

        if (!utxos) {
          return this.getErrorState(
            sendState,
            SendErrorMessage.BALANCE_NOT_FOUND
          )
        }

        const feeRate = Number(defaultMaxFeePerGas)
        const amountInSatoshis = amount ?? 0n

        // Estimate max send amount based on UTXOs and fee rate
        const maxAmount = BigInt(
          Math.max(
            getMaxTransferAmount(utxos, toAddress, fromAddress, feeRate),
            0
          )
        )

        const newState: SendState = {
          ...sendState,
          canSubmit: true,
          error: undefined,
          maxAmount
        }

        // Validate the destination address
        const isAddressValid = isBtcAddress(toAddress, isMainnet)

        if (!isAddressValid)
          return this.getErrorState(newState, SendErrorMessage.INVALID_ADDRESS)

        if (!amountInSatoshis)
          return this.getErrorState(newState, SendErrorMessage.AMOUNT_REQUIRED)

        if (amountInSatoshis > maxAmount)
          return this.getErrorState(
            newState,
            SendErrorMessage.INSUFFICIENT_BALANCE
          )

        return newState
      })
  }

  async getBalance({
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
        const network = getBitcoinNetwork(!isMainnet)
        const balancesResponse = await ModuleManager.bitcoinModule.getBalances({
          addresses: [address],
          currency,
          network: mapToVmNetwork(network)
        })
        const balances = Object.values(balancesResponse[address] ?? [])

        const utxos = balances?.[0]?.utxos || []
        const utxosWithScripts = await provider.getScriptsForUtxos(utxos)

        return {
          balance: balances?.[0]?.balance || 0n,
          utxos: utxosWithScripts
        }
      })
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
