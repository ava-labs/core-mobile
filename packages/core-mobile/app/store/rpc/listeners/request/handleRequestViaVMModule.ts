import { rpcErrors } from '@metamask/rpc-errors'
import {
  Module,
  RpcMethod as VmModuleRpcMethod
} from '@avalabs/vm-module-types'
import { AppListenerEffectAPI } from 'store'
import Logger from 'utils/Logger'
import { selectNetwork } from 'store/network/slice'
import { isRpcRequest } from 'store/rpc/utils/isRpcRequest'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
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
  const chainId = Number(caip2ChainId.split(':')[1])
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
      method: request.method as VmModuleRpcMethod,
      params: request.data.params.request.params
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
