import { AppListenerEffectAPI } from 'store'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import {
  AVM,
  EVM,
  EVMUnsignedTx,
  PVM,
  UnsignedTx
} from '@avalabs/avalanchejs-v2'
import { ethErrors } from 'eth-rpc-errors'
import { Account, selectActiveAccount } from 'store/account'
import networkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { parseAvalancheTx } from 'store/walletConnect/handlers/utils/parseAvalancheTx'
import walletService from 'services/wallet/WalletService'
import { RpcMethod } from 'store/walletConnectV2'
import { VM } from '@avalabs/avalanchejs-v2/src/serializable/constants'
import * as Sentry from '@sentry/react-native'
import Logger from 'utils/Logger'
import {
  ApproveResponse,
  DappRpcRequest,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler,
  SendTransactionApproveData
} from './types'

type UnsignedTxJson = string

export type AvalancheSendTransactionRpcRequest = DappRpcRequest<
  RpcMethod.AVALANCHE_SEND_TRANSACTION,
  UnsignedTxJson[]
>

class AvalancheSendTransactionHandler
  implements
    RpcRequestHandler<
      AvalancheSendTransactionRpcRequest,
      SendTransactionApproveData
    >
{
  methods = [RpcMethod.AVALANCHE_SEND_TRANSACTION]

  handle = async (
    request: AvalancheSendTransactionRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse => {
    const { getState } = listenerApi
    const unsignedTxJson = request.payload.params[0]

    if (!unsignedTxJson) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Missing unsigned transaction JSON object'
        })
      }
    }
    const unsignedTx = UnsignedTx.fromJSON(unsignedTxJson)
    const vm = unsignedTx.getVM()
    const activeAccount = selectActiveAccount(getState())
    const currentAddress = getAddressByVM(vm, activeAccount)

    if (!currentAddress) {
      return {
        success: false,
        error: ethErrors.rpc.resourceNotFound({
          message: 'No active account found'
        })
      }
    }

    const isDevMode = selectIsDeveloperMode(getState())
    const prov = await networkService.getAvalancheProviderXP(isDevMode)
    const txBuffer = Buffer.from(unsignedTx.toBytes())
    const txData = await parseAvalancheTx(txBuffer, vm, prov, currentAddress)

    // Throw an error if we can't parse the transaction
    if (txData.type === 'unknown') {
      return {
        success: false,
        error: ethErrors.rpc.internal({
          message: 'Unable to parse transaction data. Unsupported tx type?'
        })
      }
    }

    const approveData: SendTransactionApproveData = {
      unsignedTxJson,
      txBuffer,
      txData,
      vm
    }

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.SendTransaction,
        params: { request, data: approveData }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: {
      request: AvalancheSendTransactionRpcRequest
      data: SendTransactionApproveData
    },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse => {
    try {
      const { getState } = listenerApi
      const { txBuffer, vm, unsignedTxJson } = payload.data

      // We need to know if transaction is on C or X/P, the generated tx object is slightly different for C
      // EVM in Avalanche context means the CoreEth layer.
      const chainAlias = vm === 'EVM' ? 'C' : 'X'
      // Sign the transaction and return signature
      const activeAccount = selectActiveAccount(getState())
      const isDevMode = selectIsDeveloperMode(getState())
      const activeNetwork = networkService.getAvalancheNetworkXP(isDevMode)
      if (!activeAccount) {
        throw new Error('Unable to submit transaction, no active account.')
      }
      const sig = await walletService.sign(
        {
          tx: txBuffer,
          chain: chainAlias
        },
        activeAccount.index,
        activeNetwork
      )

      // Parse the json into a tx object
      const unsignedTx =
        chainAlias === 'C'
          ? EVMUnsignedTx.fromJSON(unsignedTxJson)
          : UnsignedTx.fromJSON(unsignedTxJson)
      // Add the signature
      unsignedTx.addSignature(Buffer.from(sig, 'hex'))

      if (!unsignedTx.hasAllSignatures())
        throw new Error('Unable to submit transaction, missing signatures.')

      // Submit the transaction and return the tx id
      const prov = await networkService.getAvalancheProviderXP(isDevMode)
      const result = await prov.issueTx(unsignedTx.getSignedTx())
      return { success: true, value: result.txID }
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
        tags: { dapps: 'sendTransaction' }
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

function getAddressByVM(vm: VM, account: Account | undefined) {
  if (!account) {
    return
  }

  if (vm === AVM) {
    return account.addressAVM
  } else if (vm === PVM) {
    return account.addressPVM
  } else if (vm === EVM) {
    return account.addressCoreEth
  }
}

export const avalancheSendTransactionHandler =
  new AvalancheSendTransactionHandler()
