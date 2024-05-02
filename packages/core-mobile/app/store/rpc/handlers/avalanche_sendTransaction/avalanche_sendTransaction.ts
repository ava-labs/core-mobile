import Config from 'react-native-config'
import { AppListenerEffectAPI } from 'store'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import {
  avaxSerial,
  EVM,
  EVMUnsignedTx,
  UnsignedTx,
  utils,
  VM
} from '@avalabs/avalanchejs'
import { ethErrors } from 'eth-rpc-errors'
import { selectActiveAccount } from 'store/account/slice'
import networkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import walletService from 'services/wallet/WalletService'
import { RpcMethod, RpcRequest } from 'store/rpc/types'
import * as Sentry from '@sentry/react-native'
import Logger from 'utils/Logger'
import { Avalanche } from '@avalabs/wallets-sdk'
import { getAddressByVM } from 'store/account/utils'
import { getProvidedUtxos } from 'utils/getProvidedUtxos'
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

const GLACIER_URL = Config.GLACIER_URL
const GLACIER_API_KEY = Config.GLACIER_API_KEY

export type AvalancheTxParams = {
  transactionHex: string
  chainAlias: 'X' | 'P' | 'C'
  externalIndices?: number[]
  internalIndices?: number[]
  utxos?: string[]
}

export type SendTransactionApproveData = {
  unsignedTxJson: string
  txData: Avalanche.Tx
  vm: VM
}

export type AvalancheSendTransactionRpcRequest =
  RpcRequest<RpcMethod.AVALANCHE_SEND_TRANSACTION>

class AvalancheSendTransactionHandler
  implements
    RpcRequestHandler<
      AvalancheSendTransactionRpcRequest,
      never,
      string,
      SendTransactionApproveData
    >
{
  methods = [RpcMethod.AVALANCHE_SEND_TRANSACTION]

  handle = async (
    request: AvalancheSendTransactionRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse<never> => {
    let unsignedTx: UnsignedTx | EVMUnsignedTx
    const { getState } = listenerApi
    const result = parseRequestParams(request.data.params.request.params)

    if (!result.success) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Missing mandatory param(s)'
        })
      }
    }

    const {
      transactionHex,
      chainAlias,
      externalIndices,
      internalIndices,
      utxos: providedUtxoHexes
    } = result.data

    const vm = Avalanche.getVmByChainAlias(chainAlias)
    const txBytes = utils.hexToBuffer(transactionHex)
    const isDevMode = selectIsDeveloperMode(getState())
    const provider = await networkService.getAvalancheProviderXP(isDevMode)
    const activeAccount = selectActiveAccount(getState())
    const currentAddress = getAddressByVM(vm, activeAccount)

    if (!currentAddress) {
      return {
        success: false,
        error: ethErrors.rpc.invalidRequest({
          message: 'No active account found'
        })
      }
    }

    const providedUtxos = getProvidedUtxos({
      utxoHexes: providedUtxoHexes,
      vm
    })

    const utxos = providedUtxos.length
      ? providedUtxos
      : await Avalanche.getUtxosByTxFromGlacier({
          transactionHex,
          chainAlias,
          isTestnet: isDevMode,
          url: GLACIER_URL as string,
          token: GLACIER_API_KEY
        })

    if (chainAlias === 'C') {
      unsignedTx = await Avalanche.createAvalancheEvmUnsignedTx({
        txBytes,
        vm,
        utxos,
        fromAddress: currentAddress
      })
    } else {
      const tx = utils.unpackWithManager(vm, txBytes) as avaxSerial.AvaxTx

      const externalAddresses = await walletService.getAddressesByIndices({
        indices: externalIndices ?? [],
        chainAlias,
        isChange: false,
        isTestnet: isDevMode
      })

      const internalAddresses = await walletService.getAddressesByIndices({
        indices: internalIndices ?? [],
        chainAlias,
        isChange: true,
        isTestnet: isDevMode
      })

      const fromAddresses = [
        ...new Set([currentAddress, ...externalAddresses, ...internalAddresses])
      ]

      const fromAddressBytes = fromAddresses.map(
        address => utils.parse(address)[2]
      )

      unsignedTx = await Avalanche.createAvalancheUnsignedTx({
        tx,
        utxos,
        provider,
        fromAddressBytes
      })
    }

    const txData = await Avalanche.parseAvalancheTx(
      unsignedTx,
      provider,
      currentAddress
    )

    // Throw an error if we can't parse the transaction
    if (txData.type === 'unknown') {
      return {
        success: false,
        error: ethErrors.rpc.internal({
          message: 'Unable to parse transaction data. Unsupported tx type'
        })
      }
    }

    const approveData: SendTransactionApproveData = {
      unsignedTxJson: JSON.stringify(unsignedTx.toJSON()),
      txData,
      vm
    }

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.AvalancheSendTransactionV2,
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
  ): ApproveResponse<string> => {
    try {
      const { getState } = listenerApi
      const parsedParams = parseRequestParams(
        payload.request.data.params.request.params
      )

      if (!parsedParams.success) {
        throw new Error('Missing mandatory param(s)')
      }

      const { externalIndices, internalIndices } = parsedParams.data

      const {
        data: { vm, unsignedTxJson }
      } = payload
      // Parse the json into a tx object
      const unsignedTx =
        vm === EVM
          ? EVMUnsignedTx.fromJSON(unsignedTxJson)
          : UnsignedTx.fromJSON(unsignedTxJson)

      const hasMultipleAddresses =
        unsignedTx.addressMaps.getAddresses().length > 1

      if (
        hasMultipleAddresses &&
        !(externalIndices ?? []).length &&
        !(internalIndices ?? []).length
      ) {
        throw new Error(
          'Transaction contains multiple addresses, but indices were not provided'
        )
      }

      const isDevMode = selectIsDeveloperMode(getState())
      const activeAccount = selectActiveAccount(getState())
      if (!activeAccount) {
        throw new Error('Unable to submit transaction, no active account.')
      }
      const signedTransactionJson = await walletService.sign(
        {
          tx: unsignedTx,
          externalIndices,
          internalIndices
        },
        activeAccount.index,
        // Must tell it is avalanche network
        networkService.getAvalancheNetworkXP(isDevMode)
      )

      const signedTransaction =
        vm === EVM
          ? EVMUnsignedTx.fromJSON(signedTransactionJson)
          : UnsignedTx.fromJSON(signedTransactionJson)

      if (!signedTransaction.hasAllSignatures()) {
        throw new Error('Signing error, missing signatures.')
      }

      const signedTransactionHex = Avalanche.signedTxToHex(
        signedTransaction.getSignedTx()
      )

      // Submit the transaction and return the tx id
      const provider = await networkService.getAvalancheProviderXP(isDevMode)
      const { txID } = await provider.issueTxHex(signedTransactionHex, vm)

      showTransactionSuccessToast({
        message: 'Transaction Successful',
        txHash: txID
      })

      return { success: true, value: txID }
    } catch (e) {
      Logger.error(
        'Unable to approve send transaction request',
        JSON.stringify(e)
      )

      const message =
        'message' in (e as Error)
          ? (e as Error).message
          : 'Send transaction error'

      showTransactionErrorToast({ message: 'Transaction Failed' })

      Sentry.captureException(e, {
        tags: { dapps: 'sendTransactionV2' }
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

export const avalancheSendTransactionHandler =
  new AvalancheSendTransactionHandler()
