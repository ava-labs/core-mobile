import { AppListenerEffectAPI } from 'store'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { ethErrors } from 'eth-rpc-errors'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import * as Sentry from '@sentry/react-native'
import Logger from 'utils/Logger'
import { isBtcAddress } from 'utils/isBtcAddress'
import { BN } from 'bn.js'
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
import { isDAppTransactionParams, parseRequestParams } from './utils'

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
        error: ethErrors.rpc.invalidParams({
          message: 'Missing mandatory param(s)'
        })
      }
    }

    let verifiedState: SendState

    if (isDAppTransactionParams(parseResult.data)) {
      const [address, amountSatoshi, feeRate] = parseResult.data

      // If destination address is not valid, return error
      if (!isBtcAddress(address ?? '', !isDeveloperMode)) {
        return {
          success: false,
          error: ethErrors.rpc.invalidParams({
            message: 'Not a valid address.'
          })
        }
      }

      if (!activeAccount) {
        return {
          success: false,
          error: ethErrors.rpc.invalidRequest({
            message: 'No active account found'
          })
        }
      }

      if (!activeAccount.addressBTC) {
        return {
          success: false,
          error: ethErrors.rpc.invalidRequest({
            message: 'The active account does not support BTC transactions'
          })
        }
      }

      const sendState: SendState = {
        address,
        amount: new BN(amountSatoshi),
        defaultMaxFeePerGas: BigInt(feeRate)
      }

      verifiedState = await SendServiceBTC.validateStateAndCalculateFees({
        sendState,
        isMainnet: !isDeveloperMode,
        fromAddress: activeAccount.addressBTC
      })
    } else {
      // for in-app request, we already have everything we need so no need to call validateStateAndCalculateFees
      // to get the full sendState data
      verifiedState = parseResult.data
    }

    // If we cant construct the transaction return error
    if (verifiedState.error?.error) {
      return {
        success: false,
        error: ethErrors.rpc.transactionRejected({
          message: verifiedState.error.message
        })
      }
    }

    // If we cant submit the transaction return error
    if (!verifiedState.canSubmit) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Unable to construct the transaction.'
        })
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

      const result = await WalletService.sign(
        txRequest,
        activeAccount.index,
        btcNetwork
      )

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
        error: ethErrors.rpc.internal({
          message
        })
      }
    }
  }
}

export const bitcoinSendTransactionHandler = new BitcoinSendTransactionHandler()
