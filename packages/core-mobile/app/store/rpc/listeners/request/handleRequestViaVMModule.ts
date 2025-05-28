import { rpcErrors } from '@metamask/rpc-errors'
import {
  Module,
  RpcMethod as VmModuleRpcMethod
} from '@avalabs/vm-module-types'
import { AppListenerEffectAPI } from 'store/types'
import Logger from 'utils/Logger'
import { selectNetwork } from 'store/network/slice'
import { isRpcRequest } from 'store/rpc/utils/isRpcRequest'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { getAddressByVM } from 'store/account/utils'
import MnemonicWalletInstance from 'services/wallet/MnemonicWallet'
import { Account, selectActiveAccount } from 'store/account'
import WalletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import { AgnosticRpcProvider, Request } from '../../types'

export const handleRequestViaVMModule = async ({
  module,
  request,
  rpcProvider,
  listenerApi
}: {
  module: Module
  request: Request
  rpcProvider: AgnosticRpcProvider
  listenerApi: AppListenerEffectAPI
}): Promise<void> => {
  if (!isRpcRequest(request)) {
    Logger.error('Invalid request')
    rpcProvider.onError({
      request,
      error: rpcErrors.internal('Invalid request'),
      listenerApi
    })

    return
  }

  const caip2ChainId = request.data.params.chainId
  const chainId = getChainIdFromCaip2(caip2ChainId)

  if (!chainId) {
    Logger.error(`ChainId ${caip2ChainId} not supported`)
    rpcProvider.onError({
      request,
      error: rpcErrors.resourceNotFound('Chain Id not supported'),
      listenerApi
    })

    return
  }

  const network = selectNetwork(chainId)(listenerApi.getState())

  if (!network) {
    Logger.error(`Network ${chainId} not found`)
    rpcProvider.onError({
      request,
      error: rpcErrors.resourceNotFound('Network not found'),
      listenerApi
    })

    return
  }

  const { getState } = listenerApi
  const activeAccount = selectActiveAccount(getState())

  const params = request.data.params.request.params
  const method = request.method as unknown as VmModuleRpcMethod

  const response = await module.onRpcRequest(
    {
      requestId: String(request.data.id),
      sessionId: request.data.topic,
      chainId: request.data.params.chainId,
      dappInfo: {
        name: request.peerMeta.name,
        icon: request.peerMeta.icons[0] ?? '',
        url: request.peerMeta.url
      },
      method,
      params,
      context: request.context ?? getContext(method, params, activeAccount)
    },
    mapToVmNetwork(network)
  )

  if ('error' in response) {
    rpcProvider.onError({
      request,
      error: response.error,
      listenerApi
    })
  } else {
    rpcProvider.onSuccess({
      request,
      result: response.result,
      listenerApi
    })
  }
}

const getContext = (
  method: VmModuleRpcMethod,
  params: unknown,
  activeAccount: Account | undefined
): Record<string, string> | undefined => {
  if (
    method === VmModuleRpcMethod.AVALANCHE_SEND_TRANSACTION ||
    method === VmModuleRpcMethod.AVALANCHE_SIGN_TRANSACTION
  ) {
    if (!params || typeof params !== 'object' || !('chainAlias' in params)) {
      return undefined
    }

    const vm = Avalanche.getVmByChainAlias(params.chainAlias as string)
    const currentAddress = getAddressByVM(vm, activeAccount)

    if (!currentAddress) {
      return undefined
    }

    const context: Record<string, string> = { currentAddress }

    if (WalletService.walletType === WalletType.MNEMONIC) {
      context.xpubXP = MnemonicWalletInstance.xpubXP
    }

    return context
  }

  return undefined
}
