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
import { getChainIdFromRequest } from '../../eth_sendTransaction/utils'

export const scanAndSignMessage = async ({
  request,
  network,
  account,
  data,
  address
}: {
  request: EthSignRpcRequest
  network: Network
  account: Account
  data: string | TypedData | OldTypedData
  address: string
}): Promise<void> => {
  try {
    const chainId = getChainIdFromRequest(request)
    const scanResponse = await BlockaidService.scanJsonRpc({
      chainId,
      accountAddress: address,
      data: request.data.params.request as JsonRpcRequestData,
      domain: request.peerMeta.url
    })

    if (scanResponse?.validation?.result_type === 'Malicious') {
      Navigation.navigate({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.MaliciousActivityWarning,
          params: {
            activityType: 'Transaction',
            request,
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
    Logger.error('[Blockaid]Failed to validate transaction', error)

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
