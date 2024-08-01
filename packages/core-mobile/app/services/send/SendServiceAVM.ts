import {
  GetPVMTransactionRequestParams,
  SendErrorMessage,
  SendState,
  ValidateStateAndCalculateFeesParams
} from 'services/send/types'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import SentryWrapper from 'services/sentry/SentryWrapper'
import WalletService from 'services/wallet/WalletService'
import { Avax } from 'types'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { utils } from '@avalabs/avalanchejs'
import { AvalancheTxParams } from 'store/rpc/handlers/avalanche_sendTransaction/avalanche_sendTransaction'
import { GAS_LIMIT_FOR_XP_CHAIN } from 'consts/fees'
import { getInternalExternalAddrs } from 'services/send/utils'
import { stripChainAddress } from 'store/account/utils'

export class SendServiceAVM {
  constructor(private activeNetwork: Network) {}

  async validateStateAndCalculateFees(
    params: ValidateStateAndCalculateFeesParams
  ): Promise<SendState> {
    const { sendState, nativeTokenBalance, sentryTrx } = params
    return (
      SentryWrapper.createSpanFor(sentryTrx)
        .setContext('svc.send.avm.validate_and_calc_fees')
        // eslint-disable-next-line sonarjs/cognitive-complexity
        .executeAsync(async () => {
          const { amount, address, defaultMaxFeePerGas, token } = sendState

          // Set canSubmit to false if token is not set
          if (!token) return SendServiceAVM.getErrorState(sendState, '')

          const gasLimit = GAS_LIMIT_FOR_XP_CHAIN
          const sendFee = defaultMaxFeePerGas
            ? BigInt(gasLimit) * defaultMaxFeePerGas
            : undefined
          let maxAmount = token.balance - (sendFee || 0n)
          maxAmount = maxAmount > 0n ? maxAmount : 0n

          const newState: SendState = {
            ...sendState,
            canSubmit: true,
            error: undefined,
            gasLimit,
            maxAmount,
            sendFee
          }

          if (!address)
            return SendServiceAVM.getErrorState(
              newState,
              SendErrorMessage.ADDRESS_REQUIRED
            )

          if (
            !Avalanche.isBech32Address(address, false) &&
            !Avalanche.isBech32Address(address, true)
          )
            return SendServiceAVM.getErrorState(
              newState,
              SendErrorMessage.INVALID_ADDRESS
            )

          if (!defaultMaxFeePerGas || defaultMaxFeePerGas === 0n)
            return SendServiceAVM.getErrorState(
              newState,
              SendErrorMessage.INVALID_NETWORK_FEE
            )

          if (maxAmount === 0n)
            return SendServiceAVM.getErrorState(
              newState,
              SendErrorMessage.INSUFFICIENT_BALANCE
            )

          if (!amount || amount === 0n)
            return SendServiceAVM.getErrorState(
              newState,
              SendErrorMessage.AMOUNT_REQUIRED
            )

          if (amount && amount > maxAmount)
            return SendServiceAVM.getErrorState(
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
            return SendServiceAVM.getErrorState(
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
  }: GetPVMTransactionRequestParams): Promise<AvalancheTxParams> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.avm.get_trx_request')
      .executeAsync(async () => {
        if (!fromAddress) {
          throw new Error('fromAddress must be defined')
        }
        const destinationAddress =
          'X-' + stripChainAddress(sendState.address ?? '')
        const unsignedTx = await WalletService.createSendXTx({
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
          chainAlias: 'X',
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
