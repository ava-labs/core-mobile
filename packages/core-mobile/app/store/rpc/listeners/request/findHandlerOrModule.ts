import { Module } from '@avalabs/vm-module-types'
import Logger from 'utils/Logger'
import ModuleManager from 'vmModule/ModuleManager'
import { RpcRequestHandler } from 'store/rpc/handlers/types'
import { isRpcRequest } from 'store/rpc/utils/isRpcRequest'
import { Request } from '../../types'
import handlerMap from '../../handlers'

export const findHandlerOrModule = async (
  request: Request,
  method: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<RpcRequestHandler<any, any, any, any> | Module | undefined> => {
  // find a handler first
  const handler = handlerMap.get(method)

  if (handler) return handler

  if (!isRpcRequest(request)) return

  // if no handler is found, try to find a module
  try {
    const caip2ChainId = request.data.params.chainId

    return await ModuleManager.loadModule(caip2ChainId, request.method)
  } catch (e) {
    Logger.error('Failed to load module', e)
  }
}
