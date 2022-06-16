import { isBech32AddressInNetwork } from '@avalabs/bridge-sdk'
import { BITCOIN_NETWORK, BITCOIN_TEST_NETWORK } from '@avalabs/chains-sdk'
import {
  BitcoinInputUTXO,
  BitcoinOutputUTXO,
  createTransferTx
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
import networkService from 'services/network/NetworkService'

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
    const provider = await networkService.getBitcoinProvider(__DEV__)
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
    const { amount, address } = sendState
    const feeRate = sendState.gasPrice?.toNumber()
    const toAddress = address || fromAddress // in case address from form is blank
    const amountInSatoshis = amount?.toNumber() || 0
    const { balance, utxos } = await this.getBalance(
      isMainnet,
      fromAddress,
      currency
    )
    const provider = await networkService.getBitcoinProvider(isMainnet)

    const { fee: maxFee } = createTransferTx(
      toAddress,
      fromAddress,
      balance,
      feeRate || 0,
      utxos,
      provider.getNetwork()
    )
    let maxAmount = maxFee ? balance - maxFee : 0
    if (maxAmount < 0) {
      maxAmount = 0
    }

    const { fee, psbt } = createTransferTx(
      toAddress,
      fromAddress,
      amountInSatoshis,
      feeRate || 0,
      utxos,
      provider.getNetwork()
    )

    const newState: SendState = {
      ...sendState,
      canSubmit: true,
      loading: !maxAmount || typeof feeRate === 'undefined',
      error: undefined,
      maxAmount: new BN(maxAmount),
      sendFee: new BN(fee)
    }

    if (!toAddress)
      return this.getErrorState(newState, SendErrorMessage.ADDRESS_REQUIRED)

    if (toAddress && !isBech32AddressInNetwork(toAddress, isMainnet))
      return this.getErrorState(newState, SendErrorMessage.INVALID_ADDRESS)

    if (!feeRate)
      return this.getErrorState(newState, SendErrorMessage.INVALID_NETWORK_FEE)

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
