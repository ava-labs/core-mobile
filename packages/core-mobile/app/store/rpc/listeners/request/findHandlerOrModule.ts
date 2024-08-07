import { Module } from '@avalabs/vm-module-types'
import Logger from 'utils/Logger'
import ModuleManager from 'vmModule/ModuleManager'
import { RpcRequestHandler } from 'store/rpc/handlers/types'
import { isRpcRequest } from 'store/rpc/utils/isRpcRequest'
import { AvalancheModule } from '@avalabs/avalanche-module'
import { BlockchainId } from '@avalabs/glacier-sdk'
import { Request, RpcMethod } from '../../types'
import handlerMap from '../../handlers'

const C_CHAIN_TEST_ID = 'eip155:43113'
const C_CHAIN_ID = 'eip155:43114'

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
    const chainId = request.data.params.chainId
    const chainAlias =
      // @ts-ignore
      request.data.params.request.params?.chainAlias ?? undefined
    // convert to caip2 chainId for avalanche_sendTransaction and chainAlias
    const caip2ChainId = convertToCaip2ChainId(request, chainId, chainAlias)
    return await ModuleManager.loadModule(caip2ChainId, request.method)
  } catch (e) {
    Logger.error('Failed to load module', e)
  }
}

const convertToCaip2ChainId = (
  request: Request,
  chainId: string,
  chainAlias?: string
): string => {
  if (
    request.method === RpcMethod.AVALANCHE_SEND_TRANSACTION &&
    (chainId === C_CHAIN_TEST_ID || chainId === C_CHAIN_ID) &&
    (chainAlias === 'P' || chainAlias === 'X' || chainAlias === 'C')
  ) {
    return AvalancheModule.getHashedBlockchainId({
      blockchainId: getAvalancheBlockchainId(
        chainAlias,
        chainId === C_CHAIN_TEST_ID
      ),
      isTestnet: chainId === C_CHAIN_TEST_ID
    })
  }
  return chainId
}

const getAvalancheBlockchainId = (
  chainAlias: 'P' | 'X' | 'C',
  isTestnet?: boolean
): string => {
  if (chainAlias === 'X') {
    return isTestnet
      ? BlockchainId._2JVSBOINJ9C2J33VNTVZ_YT_VJNZD_N2NKIWW_KJCUM_HUWEB5DB_BRM
      : BlockchainId._2O_YMBNV4E_NHYQK2FJJ_V5N_VQLDBTM_NJZQ5S3QS3LO6FTN_C6FBY_M
  }
  if (chainAlias === 'P')
    return BlockchainId._11111111111111111111111111111111LPO_YY

  return isTestnet
    ? BlockchainId.Y_H8D7TH_NJKXMTKUV2JG_BA4P1RN3QPR4P_PR7QYNFCDO_S6K6HWP
    : BlockchainId._2Q9E4R6MU3U68N_U1F_YJGB_R6JVWR_RX36COHP_AX5UQXSE55X1Q5
}
