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
import { SendState, ValidSendState } from 'services/send/types'
import { TokenWithBalance } from 'store/balance'
import { getBitcoinNetwork } from 'services/network/utils/providerUtils'
import { selectSelectedCurrency } from 'store/settings/currency'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import BtcBalanceService from 'services/balance/BtcBalanceService'
import { updateRequestStatus, waitForTransactionReceipt } from 'store/rpc/slice'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../types'
import { parseRequestParams } from './utils'

export type BitcoinSendTransactionApproveData = {
  sendState: ValidSendState | SendState
  balance: TokenWithBalance
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
    const btcNetwork = getBitcoinNetwork(isDeveloperMode)
    const currency = selectSelectedCurrency(state)

    if (!parseResult.success) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Missing mandatory param(s)'
        })
      }
    }

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

    if (!activeAccount.addressBtc) {
      return {
        success: false,
        error: ethErrors.rpc.invalidRequest({
          message: 'The active account does not support BTC transactions'
        })
      }
    }

    const balances = await BtcBalanceService.getBalances({
      network: btcNetwork,
      accountAddress: activeAccount.addressBtc,
      currency
    })

    if (balances[0] === undefined) {
      return {
        success: false,
        error: ethErrors.rpc.invalidRequest({
          message: 'No balance found for the active account.'
        })
      }
    }

    const sendState = {
      address,
      amount: new BN(amountSatoshi),
      maxFeePerGas: feeRate ? BigInt(feeRate) : undefined
    }

    const verifiedState = await SendServiceBTC.validateStateAndCalculateFees({
      sendState,
      isMainnet: !isDeveloperMode,
      fromAddress: activeAccount.addressBtc
    })

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
      sendState: verifiedState,
      balance: balances[0]
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
      const { getState, dispatch } = listenerApi
      const {
        data: { sendState },
        request
      } = payload
      // Parse the json into a tx object
      const isDeveloperMode = selectIsDeveloperMode(getState())
      const currency = selectSelectedCurrency(getState())
      const activeAccount = selectActiveAccount(getState())
      const btcNetwork = getBitcoinNetwork(isDeveloperMode)

      if (!activeAccount?.addressBtc) {
        return {
          success: false,
          error: ethErrors.rpc.invalidRequest({
            message: 'The active account does not support BTC transactions'
          })
        }
      }

      const txRequest = await SendServiceBTC.getTransactionRequest({
        sendState,
        isMainnet: !isDeveloperMode,
        fromAddress: activeAccount.addressBtc,
        currency
      })

      const result = await WalletService.sign(
        txRequest,
        activeAccount.index,
        btcNetwork
      )

      const hash = await NetworkService.sendTransaction({
        signedTx: result,
        network: btcNetwork,
        handleWaitToPost: txResponse => {
          dispatch(
            waitForTransactionReceipt({
              txResponse,
              requestId: request.data.id,
              requestedNetwork: btcNetwork
            })
          )
        }
      })

      dispatch(
        updateRequestStatus({
          id: request.data.id,
          status: {
            result: {
              txHash: hash,
              confirmationReceiptStatus: 'Pending'
            }
          }
        })
      )

      return {
        success: true,
        value: hash
      }
    } catch (e) {
      Logger.error(
        'Unable to approve send transaction request',
        JSON.stringify(e)
      )

      const message =
        'message' in (e as Error)
          ? (e as Error).message
          : 'Send transaction error'

      Sentry.captureException(e, {
        tags: { dapps: 'bitcoinSendTransaction' }
      })

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
