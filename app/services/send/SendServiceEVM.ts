import { resolve } from '@avalabs/utils-sdk'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import BN from 'bn.js'
import { Contract, TransactionRequest, isAddress } from 'ethers'
import ERC20 from '@openzeppelin/contracts/build/contracts/ERC20.json'
import {
  GetTransactionRequestParams,
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
  NftTokenWithBalance
} from 'store/balance'
import ERC721 from '@openzeppelin/contracts/build/contracts/ERC721.json'
import ERC1155 from '@openzeppelin/contracts/build/contracts/ERC1155.json'
import SentryWrapper from 'services/sentry/SentryWrapper'
import Logger from 'utils/Logger'

export class SendServiceEVM implements SendServiceHelper {
  private readonly networkProvider: JsonRpcBatchInternal

  constructor(private activeNetwork: Network, private fromAddress: string) {
    const provider = networkService.getProviderForNetwork(activeNetwork)
    if (!(provider instanceof JsonRpcBatchInternal))
      throw new Error('Not EVM provider')
    this.networkProvider = provider
  }

  async validateStateAndCalculateFees(
    params: ValidateStateAndCalculateFeesParams
  ): Promise<SendState> {
    const { sendState, nativeTokenBalance, sentryTrx } = params
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.evm.validate_and_calc_fees')
      .executeAsync(async () => {
        const { amount, address, gasPrice, token } = sendState

        // This *should* always be defined and set by the UI
        if (!token)
          return SendServiceEVM.getErrorState(sendState, 'Invalid token')

        const gasLimit = await this.getGasLimit(sendState)
        const sendFee = gasPrice
          ? new BN(gasLimit).mul(new BN(gasPrice.toString()))
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

        if (!gasPrice || gasPrice === 0n)
          return SendServiceEVM.getErrorState(
            newState,
            SendErrorMessage.INVALID_NETWORK_FEE
          )

        if (
          token.type !== TokenType.ERC721 &&
          token.type !== TokenType.ERC1155 &&
          (!amount || amount.isZero())
        )
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
    params: GetTransactionRequestParams
  ): Promise<TransactionRequest> {
    const { sendState, sentryTrx } = params
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
      Logger.error('failed to get gas limit', error)
    }
    // add 20% padding to ensure the tx will be accepted
    return Math.round(Number(gasLimit || 0) * 1.2)
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
        sendState as SendState<NftTokenWithBalance>
      )
    } else if (sendState.token.type === TokenType.ERC1155) {
      return this.getUnsignedTxERC1155(
        sendState as SendState<NftTokenWithBalance>
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
      value: BigInt(sendState.amount?.toString() || 0n)
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
    const populatedTransaction =
      await contract?.transfer?.populateTransaction?.(
        sendState.address,
        sendState.amount ? BigInt(sendState.amount.toString()) : 0n
      )
    return {
      ...populatedTransaction, // only includes `to` and `data`
      from: this.fromAddress
    }
  }

  private async getUnsignedTxERC721(
    sendState: SendState<NftTokenWithBalance>
  ): Promise<TransactionRequest> {
    const contract = new Contract(
      sendState.token?.address || '',
      ERC721.abi,
      this.networkProvider
    )
    const populatedTransaction = await contract?.[
      'safeTransferFrom(address,address,uint256)'
    ]?.populateTransaction?.(
      this.fromAddress,
      sendState.address,
      sendState.token?.tokenId
    )
    return {
      ...populatedTransaction, // only includes `to` and `data`
      from: this.fromAddress
    }
  }

  private async getUnsignedTxERC1155(
    sendState: SendState<NftTokenWithBalance>
  ): Promise<TransactionRequest> {
    const contract = new Contract(
      sendState.token?.address || '',
      ERC1155.abi,
      this.networkProvider
    )

    const populatedTransaction = await contract[
      'safeTransferFrom(address,address,uint256,uint256,bytes)'
    ]?.populateTransaction?.(
      this.fromAddress,
      sendState.address,
      sendState.token?.tokenId,
      1,
      '0x'
    )

    const unsignedTx: TransactionRequest = {
      ...populatedTransaction, // only includes `to` and `data`
      from: this.fromAddress
    }

    return unsignedTx
  }
}
