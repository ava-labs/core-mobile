import { isBech32AddressInNetwork } from '@avalabs/bridge-sdk'
import { BITCOIN_NETWORK, BITCOIN_TEST_NETWORK } from '@avalabs/chains-sdk'
import {
  BitcoinInputUTXO,
  BitcoinOutputUTXO,
  createTransferTx,
  getMaxTransferAmount
} from '@avalabs/wallets-sdk'
import BN from 'bn.js'
import {
  SendErrorMessage,
  SendServiceHelper,
  SendState,
  ValidSendState
} from 'services/send/types'

// singleton services
import balanceService from 'services/balance/BalanceService'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'

class SendServiceBTC implements SendServiceHelper {
  async getTransactionRequest(
    sendState: ValidSendState,
    isMainnet: boolean,
    fromAddress: string,
    currency: string
  ): Promise<{
    inputs: BitcoinInputUTXO[]
    outputs: BitcoinOutputUTXO[]
  }> {
    const { address: toAddress, amount } = sendState
    const feeRate = sendState.gasPrice.toNumber()
    const provider = getBitcoinProvider(!isMainnet)
    const { utxos } = await this.getBalance(isMainnet, fromAddress, currency)

    const { inputs, outputs } = createTransferTx(
      toAddress,
      fromAddress,
      amount.toNumber(),
      feeRate,
      utxos,
      provider.getNetwork()
    )

    if (!inputs || !outputs) {
      throw new Error('Unable to create transaction')
    }

    return { inputs, outputs }
  }

  async validateStateAndCalculateFees(
    sendState: SendState,
    isMainnet: boolean,
    fromAddress: string,
    currency: string
  ): Promise<SendState | ValidSendState> {
    const { amount, address: toAddress } = sendState
    const feeRate = sendState.gasPrice?.toNumber()
    const amountInSatoshis = amount?.toNumber() || 0
    const { utxos } = await this.getBalance(isMainnet, fromAddress, currency)
    const provider = getBitcoinProvider(!isMainnet)

    if (!feeRate)
      return this.getErrorState(
        {
          ...sendState
        },
        SendErrorMessage.INVALID_NETWORK_FEE
      )

    // Estimate max send amount based on UTXOs and fee rate
    // Since we are only using bech32 addresses we can use this.address to estimate
    const maxAmount = new BN(
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
    const isAddressValid = isBech32AddressInNetwork(toAddress, isMainnet)

    if (!isAddressValid)
      return this.getErrorState(
        { ...sendState, canSubmit: false, maxAmount },
        SendErrorMessage.INVALID_ADDRESS
      )

    const { fee, psbt } = createTransferTx(
      toAddress,
      fromAddress,
      amountInSatoshis,
      feeRate,
      utxos,
      provider.getNetwork()
    )

    const newState: SendState = {
      ...sendState,
      canSubmit: !!psbt,
      error: undefined,
      maxAmount,
      sendFee: new BN(fee)
    }

    if (!amountInSatoshis)
      return this.getErrorState(newState, SendErrorMessage.AMOUNT_REQUIRED)

    if (!psbt && amountInSatoshis > 0)
      return this.getErrorState(newState, SendErrorMessage.INSUFFICIENT_BALANCE)

    return newState
  }

  private async getBalance(
    isMainnet: boolean,
    address: string,
    currency: string
  ): Promise<{
    balance: number
    utxos: BitcoinInputUTXO[]
  }> {
    const token = await balanceService.getBalancesForAddress(
      isMainnet ? BITCOIN_NETWORK : BITCOIN_TEST_NETWORK,
      address,
      currency
    )

    return {
      balance: token?.[0]?.balance.toNumber() || 0,
      utxos: token?.[0]?.utxos || []
    }
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
