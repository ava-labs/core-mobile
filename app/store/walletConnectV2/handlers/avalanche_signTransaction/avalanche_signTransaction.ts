import { AppListenerEffectAPI } from 'store'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import {
  AVM,
  EVM,
  EVMUnsignedTx,
  PVM,
  UnsignedTx,
  avaxSerial,
  utils
} from '@avalabs/avalanchejs-v2'
import { ethErrors } from 'eth-rpc-errors'
import { Account, selectActiveAccount } from 'store/account'
import networkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import walletService from 'services/wallet/WalletService'
import { RpcMethod, SessionRequest } from 'store/walletConnectV2'
import { VM } from '@avalabs/avalanchejs-v2'
import * as Sentry from '@sentry/react-native'
import Logger from 'utils/Logger'
import { Avalanche } from '@avalabs/wallets-sdk'
import {
  ApproveResponse,
  DEFERRED_RESULT,
  HandleResponse,
  RpcRequestHandler
} from '../types'

type AvalancheTxParams = {
  transactionHex: string
  chainAlias: 'X' | 'P' | 'C'
  externalIndices?: number[]
  internalIndices?: number[]
}

export type SendTransactionApproveData = {
  unsignedTxJson: string
  txData: Avalanche.TxType
  vm: VM
}

export type AvalancheSendTransactionRpcRequest = SessionRequest<
  RpcMethod.AVALANCHE_SEND_TRANSACTION,
  AvalancheTxParams
>

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
    const { transactionHex, chainAlias, externalIndices, internalIndices } =
      request.data.params.request.params ?? {}

    if (!transactionHex || !chainAlias) {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Missing mandatory param(s)'
        })
      }
    }
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

    if (chainAlias === 'C') {
      unsignedTx = await Avalanche.createAvalancheEvmUnsignedTx({
        txBytes,
        vm,
        provider,
        fromAddress: currentAddress
      })
    } else {
      const tx = utils.unpackWithManager(vm, txBytes) as avaxSerial.AvaxTx

      const externalAddresses = await walletService.getAddressesByIndices(
        externalIndices ?? [],
        chainAlias,
        false,
        isDevMode
      )

      const internalAddresses = await walletService.getAddressesByIndices(
        internalIndices ?? [],
        chainAlias,
        true,
        isDevMode
      )

      const fromAddresses = [
        ...new Set([currentAddress, ...externalAddresses, ...internalAddresses])
      ]

      const fromAddressBytes = fromAddresses.map(
        address => utils.parse(address)[2]
      )

      unsignedTx = await Avalanche.createAvalancheUnsignedTx({
        tx,
        vm,
        provider,
        fromAddressBytes
      })
    }

    const txData = await Avalanche.parseAvalancheTx(
      unsignedTx.getTx(),
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
      const {
        data: { vm, unsignedTxJson },
        request: {
          data: {
            params: {
              request: {
                params: { externalIndices, internalIndices }
              }
            }
          }
        }
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
      const result = await provider.issueTxHex(signedTransactionHex, vm)

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
