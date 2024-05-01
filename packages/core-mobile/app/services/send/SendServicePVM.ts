import BN from 'bn.js'
import {
  GetPVMTransactionRequestParams,
  SendErrorMessage,
  SendState,
  ValidateStateAndCalculateFeesParams
} from 'services/send/types'
import { Network } from '@avalabs/chains-sdk'
import { TokenType } from 'store/balance'
import SentryWrapper from 'services/sentry/SentryWrapper'
import WalletService from 'services/wallet/WalletService'
import { Avax } from 'types'
import { Avalanche } from '@avalabs/wallets-sdk'
import { utils } from '@avalabs/avalanchejs'
import { getInternalExternalAddrs } from 'services/send/utils'
import { AvalancheTxParams } from 'store/rpc/handlers/avalanche_sendTransaction/avalanche_sendTransaction'
import { GAS_LIMIT_FOR_XP_CHAIN } from 'consts/fees'

export class SendServicePVM {
  constructor(private activeNetwork: Network) {}

  async validateStateAndCalculateFees(
    params: ValidateStateAndCalculateFeesParams
  ): Promise<SendState> {
    const { sendState, nativeTokenBalance, sentryTrx } = params
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.pvm.validate_and_calc_fees')
      .executeAsync(async () => {
        const { amount, address, defaultMaxFeePerGas, token } = sendState

        // Set canSubmit to false if token is not set
        if (!token) return SendServicePVM.getErrorState(sendState, '')

        const gasLimit = GAS_LIMIT_FOR_XP_CHAIN
        const sendFee = defaultMaxFeePerGas
          ? new BN(gasLimit).mul(new BN(defaultMaxFeePerGas.toString()))
          : undefined
        const maxAmount = token.balance.sub(sendFee || new BN(0))

        const newState: SendState = {
          ...sendState,
          canSubmit: true,
          error: undefined,
          gasLimit,
          maxAmount,
          sendFee
        }

        if (!address)
          return SendServicePVM.getErrorState(
            newState,
            SendErrorMessage.ADDRESS_REQUIRED
          )

        if (!Avalanche.isBech32Address(address, true))
          return SendServicePVM.getErrorState(
            newState,
            SendErrorMessage.INVALID_ADDRESS
          )

        if (!defaultMaxFeePerGas || defaultMaxFeePerGas === 0n)
          return SendServicePVM.getErrorState(
            newState,
            SendErrorMessage.INVALID_NETWORK_FEE
          )

        if (!amount || amount.isZero())
          return SendServicePVM.getErrorState(
            newState,
            SendErrorMessage.AMOUNT_REQUIRED
          )

        if (amount?.gt(maxAmount))
          return SendServicePVM.getErrorState(
            newState,
            SendErrorMessage.INSUFFICIENT_BALANCE
          )

        if (
          token.type !== TokenType.NATIVE &&
          sendFee &&
          nativeTokenBalance?.lt(sendFee)
        )
          return SendServicePVM.getErrorState(
            newState,
            SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE
          )

        return newState
      })
  }

  async getTransactionRequest({
    sendState,
    sentryTrx,
    accountIndex,
    fromAddress
  }: GetPVMTransactionRequestParams): Promise<AvalancheTxParams> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.send.pvm.get_trx_request')
      .executeAsync(async () => {
        if (!fromAddress) {
          throw new Error('fromAddress must be defined')
        }
        const unsignedTx = await WalletService.createSendPTx({
          accountIndex,
          amount: Avax.fromNanoAvax(sendState.amount || 0),
          avaxXPNetwork: this.activeNetwork,
          destinationAddress: sendState.address,
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
