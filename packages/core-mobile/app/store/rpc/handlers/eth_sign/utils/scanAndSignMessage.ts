import BlockaidService from 'services/blockaid/BlockaidService'
import { JsonRpcRequestData } from 'services/blockaid/types'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { SignMessageV2Params } from 'navigation/types'
import Logger from 'utils/Logger'
import { Network } from '@avalabs/chains-sdk'
import {
  OldTypedData,
  TypedData
} from 'store/rpc/handlers/eth_sign/schemas/ethSignTypedData'
import { Account } from 'store/account'
import { EthSignRpcRequest } from 'store/rpc/handlers/eth_sign/eth_sign'
import { getChainIdFromRequest } from 'store/rpc/utils/getChainIdFromRequest/getChainIdFromRequest'
import { onRequestRejected } from 'store/rpc/slice'
import { providerErrors } from '@metamask/rpc-errors'
import { AnyAction, Dispatch } from '@reduxjs/toolkit'

export const scanAndSignMessage = async ({
  request,
  network,
  account,
  data,
  address,
  dispatch
}: {
  request: EthSignRpcRequest
  network: Network
  account: Account
  data: string | TypedData | OldTypedData
  address: string
  dispatch: Dispatch<AnyAction>
}): Promise<void> => {
  try {
    const chainId = getChainIdFromRequest(request)
    const scanResponse = await BlockaidService.scanJsonRpc({
      chainId,
      accountAddress: address,
      data: request.data.params.request as JsonRpcRequestData,
      domain: request.peerMeta.url
    })

    const onReject = (): void => {
      dispatch(
        onRequestRejected({
          request,
          error: providerErrors.userRejectedRequest()
        })
      )
    }

    if (scanResponse?.validation?.result_type === 'Malicious') {
      Navigation.navigate({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.MaliciousActivityWarning,
          params: {
            title: 'Scam Transaction',
            subTitle: 'This transaction is malicious, do not proceed.',
            rejectButtonTitle: 'Reject Transaction',
            onReject,
            onProceed: () => {
              navigateToSignMessage({
                request,
                network,
                account,
                data,
                scanResponse
              })
            }
          }
        }
      })
    } else {
      navigateToSignMessage({ request, network, account, data, scanResponse })
    }
  } catch (error) {
    Logger.error('[Blockaid] Failed to validate transaction', error)

    navigateToSignMessage({ request, network, account, data })
  }
}

export const navigateToSignMessage = (params: SignMessageV2Params): void => {
  Navigation.navigate({
    name: AppNavigation.Root.Wallet,
    params: {
      screen: AppNavigation.Modal.SignMessageV2,
      params
    }
  })
}
