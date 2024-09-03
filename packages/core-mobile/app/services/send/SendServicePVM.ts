import {
  GetPVMTransactionRequestParams,
  SendErrorMessage,
  SendState,
  ValidateStateAndCalculateFeesParams
} from 'services/send/types'
import { Network } from '@avalabs/core-chains-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
import WalletService from 'services/wallet/WalletService'
import { Avax } from 'types'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { utils } from '@avalabs/avalanchejs'
import { getInternalExternalAddrs } from 'services/send/utils'
import { GAS_LIMIT_FOR_XP_CHAIN } from 'consts/fees'
import { stripChainAddress } from 'store/account/utils'
import { TokenType } from '@avalabs/vm-module-types'
import {
  AvalancheSendTransactionParams,
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'

export class SendServicePVM {
  constructor(private activeNetwork: Network) {}

  async validateStateAndCalculateFees(
    params: ValidateStateAndCalculateFeesParams
  ): Promise<SendState> {
    const { sendState, nativeTokenBalance, sentryTrx } = params
    return (
      SentryWrapper.createSpanFor(sentryTrx)
        .setContext('svc.send.pvm.validate_and_calc_fees')
        // eslint-disable-next-line sonarjs/cognitive-complexity
        .executeAsync(async () => {
          const { amount, address, defaultMaxFeePerGas, token } = sendState

          // Set canSubmit to false if token/address is not set
          if (!token || !address)
            return SendServicePVM.getErrorState(sendState, '')

          const gasLimit = GAS_LIMIT_FOR_XP_CHAIN
          const sendFee = defaultMaxFeePerGas
            ? BigInt(gasLimit) * defaultMaxFeePerGas
            : undefined
          const availableBalance =
            isTokenWithBalanceAVM(token) || isTokenWithBalancePVM(token)
              ? token.available
              : token.balance
          let maxAmount = availableBalance && availableBalance - (sendFee || 0n)
          maxAmount = maxAmount && maxAmount > 0n ? maxAmount : 0n

          const newState: SendState = {
            ...sendState,
            canSubmit: true,
            error: undefined,
            gasLimit,
            maxAmount,
            sendFee
          }

          if (
            !Avalanche.isBech32Address(address, false) &&
            !Avalanche.isBech32Address(address, true)
          )
            return SendServicePVM.getErrorState(
              newState,
              SendErrorMessage.INVALID_ADDRESS
            )

          if (!defaultMaxFeePerGas || defaultMaxFeePerGas === 0n)
            return SendServicePVM.getErrorState(
              newState,
              SendErrorMessage.INVALID_NETWORK_FEE
            )

          if (maxAmount === 0n)
            return SendServicePVM.getErrorState(
              newState,
              SendErrorMessage.INSUFFICIENT_BALANCE
            )

          if (!amount || amount === 0n)
            return SendServicePVM.getErrorState(
              newState,
              SendErrorMessage.AMOUNT_REQUIRED
            )

          if (amount && amount > maxAmount)
            return SendServicePVM.getErrorState(
              newState,
              SendErrorMessage.INSUFFICIENT_BALANCE
            )

          if (
            sendFee &&
            ((token.type !== TokenType.NATIVE &&
              nativeTokenBalance &&
              nativeTokenBalance < sendFee) ||
              (token.type === TokenType.NATIVE && token.balance < sendFee))
          )
            return SendServicePVM.getErrorState(
              newState,
              SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE
            )

          return newState
        })
    )
  }

  async getTransactionRequest({
    sendState,
    sentryTrx,
    accountIndex,
    fromAddress
  }: GetPVMTransactionRequestParams): Promise<AvalancheSendTransactionParams> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.pvm.get_trx_request')
      .executeAsync(async () => {
        if (!fromAddress) {
          throw new Error('fromAddress must be defined')
        }
        const destinationAddress =
          'P-' + stripChainAddress(sendState.address ?? '')
        const unsignedTx = await WalletService.createSendPTx({
          accountIndex,
          amount: Avax.fromNanoAvax(sendState.amount || 0),
          avaxXPNetwork: this.activeNetwork,
          destinationAddress: destinationAddress,
          sourceAddress: fromAddress ?? ''
        })

        const manager = utils.getManagerForVM(unsignedTx.getVM())
        const unsignedTxBytes = unsignedTx.toBytes()
        const [codec] = manager.getCodecFromBuffer(unsignedTxBytes)

        return {
          transactionHex: utils.bufferToHex(unsignedTxBytes),
          chainAlias: 'P',
          utxos: unsignedTx.utxos.map(utxo =>
            utils.bufferToHex(utxo.toBytes(codec))
          ),
          ...getInternalExternalAddrs(
            unsignedTx.utxos,
            { [fromAddress]: { space: 'e', index: 0 } },
            this.activeNetwork.isTestnet === true
          )
        }
      })
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
}
