import { resolve } from '@avalabs/utils-sdk'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import BN from 'bn.js'
import { isAddress, TransactionRequest } from 'ethers'
import {
  GetTransactionRequestParams,
  SendErrorMessage,
  SendServiceHelper,
  SendState,
  ValidateStateAndCalculateFeesParams
} from 'services/send/types'
import { Network } from '@avalabs/chains-sdk'
import {
  NftTokenWithBalance,
  TokenType,
  TokenWithBalanceERC20
} from 'store/balance'
import SentryWrapper from 'services/sentry/SentryWrapper'
import Logger from 'utils/Logger'
import {
  ERC1155__factory,
  ERC20__factory,
  ERC721__factory
} from 'contracts/openzeppelin'
import { getEvmProvider } from 'services/network/utils/providerUtils'
import { bigIntToHex } from 'utils/bigNumbers/bigIntToHex'

export class SendServiceEVM implements SendServiceHelper {
  private readonly networkProvider: JsonRpcBatchInternal

  constructor(private activeNetwork: Network, private fromAddress: string) {
    this.networkProvider = getEvmProvider(activeNetwork)
  }

  async validateStateAndCalculateFees(
    params: ValidateStateAndCalculateFeesParams
  ): Promise<SendState> {
    const { sendState, nativeTokenBalance, sentryTrx } = params
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.evm.validate_and_calc_fees')
      .executeAsync(async () => {
        const { amount, address, defaultMaxFeePerGas, token } = sendState

        // Set canSubmit to false if token is not set
        if (!token) return SendServiceEVM.getErrorState(sendState, '')

        const gasLimit = await this.getGasLimit(sendState)
        const sendFee = defaultMaxFeePerGas
          ? new BN(gasLimit).mul(new BN(defaultMaxFeePerGas.toString()))
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

        if (!defaultMaxFeePerGas || defaultMaxFeePerGas === 0n)
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
        const gasLimit = await this.getGasLimit(sendState)

        return {
          ...unsignedTx,
          chainId,
          gasLimit
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
      value: bigIntToHex(BigInt(sendState.amount?.toString() || 0n))
    }
  }

  private async getUnsignedTxERC20(
    sendState: SendState<TokenWithBalanceERC20>
  ): Promise<TransactionRequest> {
    if (!sendState.address)
      throw new Error('Cannot create transaction without an address')
    const erc20 = ERC20__factory.connect(
      sendState.token?.address || '',
      this.networkProvider
    )
    const populatedTransaction = await erc20.transfer.populateTransaction(
      sendState.address,
      sendState.amount ? BigInt(sendState.amount.toString()) : 0n
    )

    return {
      from: this.fromAddress,
      to: populatedTransaction.to,
      data: populatedTransaction.data
    }
  }

  private async getUnsignedTxERC721(
    sendState: SendState<NftTokenWithBalance>
  ): Promise<TransactionRequest> {
    const erc721 = ERC721__factory.connect(
      sendState.token?.address || '',
      this.networkProvider
    )
    const populatedTransaction = await erc721[
      'safeTransferFrom(address,address,uint256)'
    ].populateTransaction(
      this.fromAddress,
      sendState.address || '',
      sendState.token?.tokenId || ''
    )
    return {
      from: this.fromAddress,
      to: populatedTransaction.to,
      data: populatedTransaction.data
    }
  }

  private async getUnsignedTxERC1155(
    sendState: SendState<NftTokenWithBalance>
  ): Promise<TransactionRequest> {
    const erc1155 = ERC1155__factory.connect(
      sendState.token?.address || '',
      this.networkProvider
    )

    const populatedTransaction =
      await erc1155.safeTransferFrom.populateTransaction(
        this.fromAddress,
        sendState.address || '',
        sendState.token?.tokenId || '',
        1,
        '0x'
      )

    const unsignedTx: TransactionRequest = {
      from: this.fromAddress,
      to: populatedTransaction.to,
      data: populatedTransaction.data
    }

    return unsignedTx
  }
}
