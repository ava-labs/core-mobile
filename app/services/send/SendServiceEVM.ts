import {
  bnToEthersBigNumber,
  ethersBigNumberToBN,
  resolve
} from '@avalabs/utils-sdk'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { TransactionRequest } from '@ethersproject/providers'
import BN from 'bn.js'
import { BigNumber, Contract } from 'ethers'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import {
  SendErrorMessage,
  SendServiceHelper,
  SendState,
  ValidateStateAndCalculateFeesParams
} from 'services/send/types'
import networkService from 'services/network/NetworkService'
import { Network } from '@avalabs/chains-sdk'
import {
  TokenType,
  TokenWithBalanceERC20,
  TokenWithBalanceERC721
} from 'store/balance'
import ERC721 from '@openzeppelin/contracts/build/contracts/ERC721.json'
import { isAddress } from '@ethersproject/address'
import { Transaction } from '@sentry/types'
import SentryWrapper from 'services/sentry/SentryWrapper'

export class SendServiceEVM implements SendServiceHelper {
  private readonly networkProvider: JsonRpcBatchInternal

  constructor(private activeNetwork: Network, private fromAddress: string) {
    const provider = networkService.getProviderForNetwork(activeNetwork)
    if (!(provider instanceof JsonRpcBatchInternal))
      throw new Error('Not EVM provider')
    this.networkProvider = provider
  }

  async validateStateAndCalculateFees(
    params: ValidateStateAndCalculateFeesParams,
    sentryTrx?: Transaction
  ): Promise<SendState> {
    const { sendState, nativeTokenBalance } = params
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.evm.validate_and_calc_fees')
      .executeAsync(async () => {
        const { amount, address, gasPrice, token } = sendState

        // This *should* always be defined and set by the UI
        if (!token)
          return SendServiceEVM.getErrorState(sendState, 'Invalid token')

        const gasLimit = await this.getGasLimit(sendState)
        const sendFee = gasPrice
          ? new BN(gasLimit).mul(ethersBigNumberToBN(gasPrice))
          : undefined
        const maxAmount =
          token.type === TokenType.NATIVE
            ? token.balance.sub(sendFee || new BN(0))
            : token.balance

        const newState: SendState = {
          ...sendState,
          canSubmit: true,
          error: undefined,
          gasLimit,
          gasPrice,
          maxAmount,
          sendFee
        }

        if (!address)
          return SendServiceEVM.getErrorState(
            newState,
            SendErrorMessage.ADDRESS_REQUIRED
          )

        if (!isAddress(address))
          return SendServiceEVM.getErrorState(
            newState,
            SendErrorMessage.INVALID_ADDRESS
          )

        if (!gasPrice || gasPrice.isZero())
          return SendServiceEVM.getErrorState(
            newState,
            SendErrorMessage.INVALID_NETWORK_FEE
          )

        if (token.type !== TokenType.ERC721 && (!amount || amount.isZero()))
          return SendServiceEVM.getErrorState(
            newState,
            SendErrorMessage.AMOUNT_REQUIRED
          )

        if (amount?.gt(maxAmount))
          return SendServiceEVM.getErrorState(
            newState,
            SendErrorMessage.INSUFFICIENT_BALANCE
          )

        if (
          token.type !== TokenType.NATIVE &&
          sendFee &&
          nativeTokenBalance?.lt(sendFee)
        )
          return SendServiceEVM.getErrorState(
            newState,
            SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE
          )

        return newState
      })
  }

  async getTransactionRequest(
    params: ValidateStateAndCalculateFeesParams,
    sentryTrx?: Transaction
  ): Promise<TransactionRequest> {
    const { sendState } = params
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.evm.get_trx_request')
      .executeAsync(async () => {
        const unsignedTx = await this.getUnsignedTx(sendState)
        const chainId = this.activeNetwork.chainId
        const nonce = await this.networkProvider.getTransactionCount(
          this.fromAddress
        )
        const gasLimit = await this.getGasLimit(sendState)

        return {
          ...unsignedTx,
          chainId,
          gasLimit,
          gasPrice: sendState.gasPrice,
          nonce
        }
      })
  }

  //todo: would be nice to have this logic in sdk
  private async getGasLimit(sendState: SendState): Promise<number> {
    if (!sendState.address) return 0

    const unsignedTx = await this.getUnsignedTx(sendState)
    const [gasLimit, error] = await resolve(
      this.networkProvider.estimateGas(unsignedTx)
    )
    if (
      error &&
      !(error as Error).toString().includes('insufficient funds for gas')
    ) {
      console.error(error)
    }
    // add 20% padding to ensure the tx will be accepted
    return Math.round((gasLimit?.toNumber() || 0) * 1.2)
  }

  private static getErrorState(
    sendState: SendState,
    errorMessage: string
  ): SendState {
    return {
      ...sendState,
      error: { error: true, message: errorMessage },
      canSubmit: false
    }
  }

  private async getUnsignedTx(
    sendState: SendState
  ): Promise<TransactionRequest> {
    if (!sendState.token) throw new Error('Missing token')

    if (sendState.token.type === TokenType.NATIVE) {
      //fixme - check what is real value here
      return this.getUnsignedTxNative(sendState)
    } else if (sendState.token.type === TokenType.ERC20) {
      return this.getUnsignedTxERC20(
        sendState as SendState<TokenWithBalanceERC20>
      )
    } else if (sendState.token.type === TokenType.ERC721) {
      return this.getUnsignedTxERC721(
        sendState as SendState<TokenWithBalanceERC721>
      )
    } else {
      throw new Error('Unsupported token')
    }
  }

  private async getUnsignedTxNative(
    sendState: SendState
  ): Promise<TransactionRequest> {
    return {
      from: this.fromAddress,
      to: sendState.address,
      value: bnToEthersBigNumber(sendState.amount || new BN(0))
    }
  }

  private async getUnsignedTxERC20(
    sendState: SendState<TokenWithBalanceERC20>
  ): Promise<TransactionRequest> {
    if (!sendState.address)
      throw new Error('Cannot create transaction without an address')
    const contract = new Contract(
      sendState.token?.address || '',
      ERC20.abi,
      this.networkProvider
    )
    const populatedTransaction = await contract.populateTransaction?.transfer?.(
      sendState.address,
      sendState.amount
        ? bnToEthersBigNumber(sendState.amount)
        : BigNumber.from(0)
    )
    return {
      ...populatedTransaction, // only includes `to` and `data`
      from: this.fromAddress
    }
  }

  private async getUnsignedTxERC721(
    sendState: SendState<TokenWithBalanceERC721>
  ): Promise<TransactionRequest> {
    const contract = new Contract(
      sendState.token?.address || '',
      ERC721.abi,
      this.networkProvider
    )
    const populatedTransaction = await contract.populateTransaction?.[
      'safeTransferFrom(address,address,uint256)'
    ]?.(this.fromAddress, sendState.address, sendState.token?.tokenId)
    return {
      ...populatedTransaction, // only includes `to` and `data`
      from: this.fromAddress
    }
  }
}
