import { AppListenerEffectAPI } from 'store'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { rpcErrors } from '@metamask/rpc-errors'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import * as Sentry from '@sentry/react-native'
import Logger from 'utils/Logger'
import { isBtcAddress } from 'utils/isBtcAddress'
import SendServiceBTC from 'services/send/SendServiceBTC'
import { SendState } from 'services/send/types'
import { getBitcoinNetwork } from 'services/network/utils/providerUtils'
import { selectSelectedCurrency } from 'store/settings/currency'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import {
  showTransactionErrorToast,
  showTransactionSuccessToast
} from 'utils/toast'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../types'
import { parseRequestParams } from './utils'

export type BitcoinSendTransactionApproveData = {
  sendState: SendState
}

export type BitcoinSendTransactionRpcRequest =
  RpcRequest<RpcMethod.BITCOIN_SEND_TRANSACTION>

class BitcoinSendTransactionHandler
  implements
    RpcRequestHandler<
      BitcoinSendTransactionRpcRequest,
      never,
      string,
      BitcoinSendTransactionApproveData
    >
{
  methods = [RpcMethod.BITCOIN_SEND_TRANSACTION]

  handle = async (
    request: BitcoinSendTransactionRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse<never> => {
    const { getState } = listenerApi
    const state = getState()
    const isDeveloperMode = selectIsDeveloperMode(state)
    const activeAccount = selectActiveAccount(state)
    const parseResult = parseRequestParams(request.data.params.request.params)

    if (!parseResult.success) {
      return {
        success: false,
        error: rpcErrors.invalidParams('Missing mandatory param(s)')
      }
    }

    const [address, amountSatoshi, feeRate] = parseResult.data

    // If destination address is not valid, return error
    if (!isBtcAddress(address ?? '', !isDeveloperMode)) {
      return {
        success: false,
        error: rpcErrors.invalidParams('Not a valid address.')
      }
    }

    if (!activeAccount) {
      return {
        success: false,
        error: rpcErrors.invalidRequest('No active account found')
      }
    }

    if (!activeAccount.addressBTC) {
      return {
        success: false,
        error: rpcErrors.invalidRequest(
          'The active account does not support BTC transactions'
        )
      }
    }

    const sendState: SendState = {
      address,
      amount: BigInt(amountSatoshi),
      defaultMaxFeePerGas: BigInt(feeRate)
    }

    const verifiedState = await SendServiceBTC.validateStateAndCalculateFees({
      sendState,
      isMainnet: !isDeveloperMode,
      fromAddress: activeAccount.addressBTC
    })

    // If we cant construct the transaction return error
    if (verifiedState.error?.error) {
      return {
        success: false,
        error: rpcErrors.transactionRejected(verifiedState.error.message)
      }
    }

    // If we cant submit the transaction return error
    if (!verifiedState.canSubmit) {
      return {
        success: false,
        error: rpcErrors.invalidParams('Unable to construct the transaction.')
      }
    }

    const approveData: BitcoinSendTransactionApproveData = {
      sendState: verifiedState
    }

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.BitcoinSendTransaction,
        params: { request, data: approveData }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: {
      request: BitcoinSendTransactionRpcRequest
      data: BitcoinSendTransactionApproveData
    },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse<string> => {
    try {
      const { getState } = listenerApi
      const {
        data: { sendState }
      } = payload

      // Parse the json into a tx object
      const isDeveloperMode = selectIsDeveloperMode(getState())
      const currency = selectSelectedCurrency(getState())
      const activeAccount = selectActiveAccount(getState())
      const btcNetwork = getBitcoinNetwork(isDeveloperMode)

      if (!activeAccount?.addressBTC) {
        throw new Error('The active account does not support BTC transactions')
      }

      const txRequest = await SendServiceBTC.getTransactionRequest({
        sendState,
        isMainnet: !isDeveloperMode,
        fromAddress: activeAccount.addressBTC,
        currency
      })

      const result = await WalletService.sign({
        transaction: txRequest,
        accountIndex: activeAccount.index,
        network: btcNetwork
      })

      const txHash = await NetworkService.sendTransaction({
        signedTx: result,
        network: btcNetwork
      })

      showTransactionSuccessToast({
        message: 'Transaction Successful',
        txHash
      })

      return {
        success: true,
        value: txHash
      }
    } catch (e) {
      Logger.error(
        'Unable to approve send btc transaction request',
        JSON.stringify(e)
      )

      const message =
        'message' in (e as Error)
          ? (e as Error).message
          : 'Send Btc transaction error'

      Sentry.captureException(e, {
        tags: { dapps: 'bitcoinSendTransaction' }
      })

      showTransactionErrorToast({ message: 'Transaction Failed' })

      return {
        success: false,
        error: rpcErrors.internal(message)
      }
    }
  }
}

export const bitcoinSendTransactionHandler = new BitcoinSendTransactionHandler()
