import { AppListenerEffectAPI } from 'store'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import {
  AVM,
  Credential,
  EVM,
  PVM,
  UnsignedTx,
  Utxo,
  avaxSerial,
  utils
} from '@avalabs/avalanchejs-v2'
import { ethErrors } from 'eth-rpc-errors'
import { Account, selectActiveAccount } from 'store/account'
import networkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import walletService from 'services/wallet/WalletService'
import { RpcMethod, SessionRequest } from 'store/walletConnectV2/types'
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
import { parseRequestParams } from './utils'

export type AvalancheTxParams = {
  transactionHex: string
  chainAlias: 'X' | 'P' | 'C'
}

type AvalancheSignTransactionResult = {
  signedTransactionHex: string
  signatures: {
    signature: string
    sigIndices: [number, number]
  }[]
}

export type AvalancheSignTransactionApproveData = {
  unsignedTxJson: string
  txData: Avalanche.Tx
  vm: VM
  ownSignatureIndices: [number, number][]
}

export type AvalancheSignTransactionRpcRequest = SessionRequest<
  RpcMethod.AVALANCHE_SIGN_TRANSACTION,
  AvalancheTxParams
>

class AvalancheSignTransactionHandler
  implements
    RpcRequestHandler<
      AvalancheSignTransactionRpcRequest,
      never,
      AvalancheSignTransactionResult,
      AvalancheSignTransactionApproveData
    >
{
  methods = [RpcMethod.AVALANCHE_SIGN_TRANSACTION]

  handle = async (
    request: AvalancheSignTransactionRpcRequest,
    listenerApi: AppListenerEffectAPI
  ): HandleResponse<never> => {
    const { getState } = listenerApi
    const { transactionHex, chainAlias } =
      request.data.params.request.params ?? {}
    const parseResult = parseRequestParams(request.data.params.request.params)

    if (!parseResult.success) {
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
    let credentials: Credential[] | undefined
    let utxos: Utxo[] | undefined

    if (!currentAddress) {
      return {
        success: false,
        error: ethErrors.rpc.invalidRequest({
          message: 'No active account found'
        })
      }
    }

    const tx = utils.unpackWithManager(vm, txBytes) as avaxSerial.AvaxTx

    try {
      const codecManager = utils.getManagerForVM(vm)
      const signedTx = codecManager.unpack(txBytes, avaxSerial.SignedTx)
      const unsignedTx = await Avalanche.createAvalancheUnsignedTx({
        tx,
        vm,
        provider,
        credentials: signedTx.getCredentials()
      })

      // transaction has been already (partially) signed, but it may have gaps in its signatures arrays
      // so we fill these gaps with placeholder signatures if needed
      credentials = tx.getSigIndices().map(
        (sigIndices, credentialIndex) =>
          new Credential(
            Avalanche.populateCredential(sigIndices, {
              unsignedTx,
              credentialIndex
            })
          )
      )

      // prevents double-fetching
      utxos = unsignedTx.getInputUtxos()
    } catch (err) {
      // transaction hasn't been signed yet thus we continue with a custom list of empty credentials
      // to ensure it contains a signature slot for all signature indices from the inputs
      credentials = tx
        .getSigIndices()
        .map(indicies => new Credential(Avalanche.populateCredential(indicies)))
    }

    const unsignedTx = await Avalanche.createAvalancheUnsignedTx({
      tx,
      vm,
      provider,
      credentials,
      utxos
    })

    // check if the current account's signature is needed
    const signerAddress = utils.addressesFromBytes([
      utils.parse(currentAddress)[2]
    ])[0]

    if (!signerAddress) {
      return {
        success: false,
        error: ethErrors.rpc.invalidRequest({
          message: 'Missing signer address'
        })
      }
    }

    const ownSignatureIndices =
      unsignedTx.getSigIndicesForAddress(signerAddress)

    if (!ownSignatureIndices) {
      return {
        success: false,
        error: ethErrors.rpc.invalidRequest({
          message: 'This account has nothing to sign'
        })
      }
    }

    const sigIndices = unsignedTx.getSigIndices()
    const needsToSign = ownSignatureIndices.some(([inputIndex, sigIndex]) =>
      sigIndices[inputIndex]?.includes(sigIndex)
    )

    if (!needsToSign) {
      return {
        success: false,
        error: ethErrors.rpc.invalidRequest({
          message: 'This account has nothing to sign'
        })
      }
    }

    // get display data for the UI
    const txData = await Avalanche.parseAvalancheTx(
      unsignedTx.getTx(),
      provider,
      currentAddress
    )

    if (txData.type === 'unknown') {
      return {
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'Unable to parse transaction data. Unsupported tx type'
        })
      }
    }

    const approveData: AvalancheSignTransactionApproveData = {
      unsignedTxJson: JSON.stringify(unsignedTx.toJSON()),
      txData,
      vm,
      ownSignatureIndices
    }

    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.AvalancheSignTransactionV2,
        params: { request, data: approveData }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (
    payload: {
      request: AvalancheSignTransactionRpcRequest
      data: AvalancheSignTransactionApproveData
    },
    listenerApi: AppListenerEffectAPI
  ): ApproveResponse<AvalancheSignTransactionResult> => {
    try {
      const { getState } = listenerApi
      const {
        data: { unsignedTxJson, ownSignatureIndices }
      } = payload
      // Parse the json into a tx object
      const isDevMode = selectIsDeveloperMode(getState())
      const activeAccount = selectActiveAccount(getState())

      if (!activeAccount) {
        throw new Error('Unable to submit transaction, no active account.')
      }

      const unsignedTx = UnsignedTx.fromJSON(unsignedTxJson)
      const signedTransactionJson = await walletService.sign(
        {
          tx: unsignedTx
        },
        activeAccount.index,
        networkService.getAvalancheNetworkXP(isDevMode)
      )

      const signedTransaction = UnsignedTx.fromJSON(signedTransactionJson)
      const credentials = signedTransaction.getCredentials()

      const details = unsignedTx.getSigIndices().reduce<{
        credentials: Credential[]
        ownSignatures: { signature: string; sigIndices: [number, number] }[]
      }>(
        (correctedDetails, signatureIndices, inputIndex) => {
          const signatures = signatureIndices.map(sigIndex => {
            const signature = credentials[inputIndex]?.toJSON()[sigIndex]
            const isOwnSignature = ownSignatureIndices.some(
              ownIndices =>
                JSON.stringify(ownIndices) ===
                JSON.stringify([inputIndex, sigIndex])
            )

            if (
              !signature ||
              (isOwnSignature &&
                signature.toString() ===
                  utils.bufferToHex(Avalanche.emptySignature.toBytes()))
            ) {
              throw new Error(`Failed to sign [${inputIndex}, ${sigIndex}]`)
            }

            if (isOwnSignature) {
              correctedDetails.ownSignatures.push({
                signature: signature.toString(),
                sigIndices: [inputIndex, sigIndex]
              })
            }

            return signature
          })

          correctedDetails.credentials.push(new Credential(signatures))

          return correctedDetails
        },
        {
          credentials: [],
          ownSignatures: []
        }
      )

      // create a new SignedTx with the corrected credentials
      const correctedSignexTx = new avaxSerial.SignedTx(
        signedTransaction.getTx(),
        details.credentials
      )

      return {
        success: true,
        value: {
          signedTransactionHex: Avalanche.signedTxToHex(correctedSignexTx),
          signatures: details.ownSignatures
        }
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

export const avalancheSignTransactionHandler =
  new AvalancheSignTransactionHandler()
