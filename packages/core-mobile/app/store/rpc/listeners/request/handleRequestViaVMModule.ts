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
import { Account, selectActiveAccount } from 'store/account'
import { selectActiveWallet } from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  getAddressesFromXpubXP,
  getXpubXPIfAvailable
} from 'utils/getAddressesFromXpubXP/getAddressesFromXpubXP'
import { CurrentAvalancheAccount } from '@avalabs/avalanche-module'
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
  const state = getState()
  const activeAccount = selectActiveAccount(state)
  const activeWallet = selectActiveWallet(state)
  const isTestnet = selectIsDeveloperMode(state)

  if (!activeWallet || !activeAccount) {
    Logger.error('Active wallet or account not found')
    rpcProvider.onError({
      request,
      error: rpcErrors.resourceNotFound('Active wallet or account not found'),
      listenerApi
    })
    return
  }

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
      context:
        request.context ??
        (await getContext({
          method,
          params,
          activeAccount,
          walletId: activeWallet.id,
          walletType: activeWallet.type,
          isTestnet
        }))
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

const getContext = async ({
  method,
  params,
  activeAccount,
  walletId,
  walletType,
  isTestnet
}: {
  method: VmModuleRpcMethod
  params: unknown
  activeAccount: Account | undefined
  walletId: string
  walletType: WalletType
  isTestnet: boolean
}): Promise<Record<string, unknown> | undefined> => {
  if (
    method === VmModuleRpcMethod.AVALANCHE_SEND_TRANSACTION ||
    method === VmModuleRpcMethod.AVALANCHE_SIGN_TRANSACTION
  ) {
    if (!params || typeof params !== 'object' || !('chainAlias' in params)) {
      return undefined
    }

    const context: Record<string, unknown> = {}

    if (activeAccount) {
      context.account = await getContextAccount({
        account: activeAccount,
        walletId,
        walletType,
        isTestnet,
        chainAlias: params.chainAlias as Avalanche.ChainIDAlias
      })
    }

    return context
  }

  return undefined
}

const getContextAccount = async ({
  account,
  walletId,
  walletType,
  isTestnet,
  chainAlias
}: {
  account: Account
  walletId: string
  walletType: WalletType
  isTestnet: boolean
  chainAlias: Avalanche.ChainIDAlias
}): Promise<CurrentAvalancheAccount | undefined> => {
  const vm = Avalanche.getVmByChainAlias(chainAlias)
  const currentAddress = getAddressByVM(vm, account)
  if (currentAddress && (vm === 'AVM' || vm === 'PVM' || vm === 'EVM')) {
    const xpubXP = await getXpubXPIfAvailable({
      walletId,
      walletType,
      accountIndex: account.index
    })

    const externalXPAddressesResult = await getAddressesFromXpubXP({
      accountIndex: account.index,
      walletId,
      walletType,
      isDeveloperMode: isTestnet,
      onlyWithActivity: true
    })
    const prefix = chainAlias === 'P' ? 'P' : 'X'

    return {
      xpAddress: currentAddress,
      evmAddress: account.addressC,
      xpubXP,
      externalXPAddresses: externalXPAddressesResult.xpAddresses.map(
        address => {
          return {
            index: address.index,
            address: `${prefix}-` + address.address
          }
        }
      )
    }
  }
  return undefined
}
