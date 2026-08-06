import { rpcErrors, providerErrors } from '@metamask/rpc-errors'
import {
  Module,
  RpcMethod as VmModuleRpcMethod
} from '@avalabs/vm-module-types'
import { AppListenerEffectAPI } from 'store/types'
import Logger from 'utils/Logger'
import { selectNetwork } from 'store/network/slice'
import { isRpcRequest } from 'store/rpc/utils/isRpcRequest'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import {
  getAvalancheChainAliasCaip2,
  getChainIdFromCaip2
} from 'utils/caip2ChainIds'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { getAddressByVM } from 'store/account/utils'
import {
  Account,
  selectActiveAccount,
  selectAccountByIndex
} from 'store/account'
import { selectActiveWallet } from 'store/wallet/slice'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import { isAvalancheSignMessageAuthorized } from 'store/rpc/utils/isAvalancheSignMessageAuthorized/isAvalancheSignMessageAuthorized'
import { WalletType } from 'services/wallet/types'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  selectIsInAppReviewBlocked,
  selectIsQuickSwapsAvailable
} from 'store/posthog/slice'
import { getXpubXPIfAvailable } from 'utils/getAddressesFromXpubXP/getAddressesFromXpubXP'
import { getCachedXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import { CurrentAvalancheAccount } from '@avalabs/avalanche-module'
import {
  assessDappTrust,
  DappTrustLevel,
  type DappTrustAssessment
} from 'store/rpc/handlers/wc_sessionRequest/utils'
import {
  AgnosticRpcProvider,
  CORE_MOBILE_TOPIC,
  Request,
  RequestContext
} from '../../types'

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
  const isInAppReviewBlocked = selectIsInAppReviewBlocked(
    listenerApi.getState()
  )

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

  //Check that the request is for Avalanche and that the chainAlias matches the chainId
  const chainAliasError = getAvalancheChainAliasError({
    method,
    params,
    caip2ChainId,
    isTestnet: Boolean(network.isTestnet)
  })

  if (chainAliasError) {
    Logger.error(`Avalanche chainAlias/chainId mismatch: ${chainAliasError}`)
    rpcProvider.onError({
      request,
      error: rpcErrors.invalidParams(chainAliasError),
      listenerApi
    })

    return
  }

  // avalanche_signMessage picks its signer by a dApp-supplied account index
  // (params [message, accountIndex]), not a signingData.account address, so it
  // slips past the ApprovalController grant check. Enforce the WalletConnect
  // session grant here — on the same account the approval screen will sign with
  // (selectAccountByIndex, or the active account when no index is given). No-op
  // for every other method and for in-app / injected-browser requests; fails
  // closed on a missing session. CP-14604.
  if (
    !isAvalancheSignMessageAuthorized({
      method,
      isInAppRequest: request.data.topic === CORE_MOBILE_TOPIC,
      params,
      caip2ChainId,
      activeAccount,
      getAccountByIndex: index =>
        selectAccountByIndex(activeWallet.id, index)(state),
      getSession: () => WalletConnectService.getSession(request.data.topic)
    })
  ) {
    rpcProvider.onError({
      request,
      error: providerErrors.unauthorized('Requested address is not authorized'),
      listenerApi
    })
    return
  }

  // Merge, don't fallback: a non-empty `request.context` from the caller must
  // not suppress the per-method auto-injected context (e.g. Avalanche `account`
  // for AVALANCHE_SEND/SIGN_TRANSACTION). Caller wins on key conflicts.
  let context = {
    ...(await getContext({
      method,
      params,
      activeAccount,
      walletId: activeWallet.id,
      walletType: activeWallet.type,
      isTestnet
    })),
    ...request.context
  }

  if (!isInAppReviewBlocked) {
    context = {
      ...context,
      [RequestContext.IN_APP_REVIEW]: true
    }
  }

  // Signing context for ApprovalController bypass paths — only
  // attached to in-app requests so dApp calls don't carry walletId
  // through the VM module's RPC pipeline. QUICK_SWAPS_AVAILABLE is
  // the live PostHog kill-switch snapshot the validator re-checks.
  if (request.data.topic === CORE_MOBILE_TOPIC) {
    context = {
      ...context,
      walletId: activeWallet.id,
      walletType: activeWallet.type,
      accountIndex: activeAccount.index,
      fromAddress: activeAccount.addressC,
      network,
      [RequestContext.QUICK_SWAPS_AVAILABLE]: selectIsQuickSwapsAvailable(state)
    }
  }

  const peerTrust =
    request.data.topic === CORE_MOBILE_TOPIC
      ? undefined
      : assessDappTrust({
          verifyContext: request.data.verifyContext,
          metadataUrl: request.peerMeta.url
        })

  const peerTrustWarning = getPeerTrustWarning(peerTrust)

  if (peerTrustWarning) {
    context = {
      ...context,
      [RequestContext.PEER_TRUST_WARNING]: peerTrustWarning
    }
  }

  const response = await module.onRpcRequest(
    {
      requestId: String(request.data.id),
      sessionId: request.data.topic,
      chainId: request.data.params.chainId,
      dappInfo: {
        name: request.peerMeta.name,
        icon: request.peerMeta.icons[0] ?? '',
        url: peerTrust?.originAttested
          ? peerTrust.displayUrl
          : request.peerMeta.url
      },
      method,
      params,
      context
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

/**
 * Warning text for a per-request sheet whose peer identity is actively
 * suspicious, or undefined when there is nothing to say.
 */
const getPeerTrustWarning = (
  trust: DappTrustAssessment | undefined
): string | undefined => {
  const reason = trust?.reasons[0]

  if (!reason) return undefined

  if (trust?.level === DappTrustLevel.MALICIOUS) {
    return `${reason} Do not approve unless you are certain.`
  }

  if (trust?.level === DappTrustLevel.SUSPICIOUS) {
    return `${reason} Approve only if you trust it.`
  }

  return undefined
}

// The Avalanche Primary Network chain aliases a signing request may target.
const isAvalancheChainAlias = (
  value: unknown
): value is Avalanche.ChainIDAlias =>
  value === 'X' || value === 'P' || value === 'C'

const isAvalancheSigningMethod = (method: VmModuleRpcMethod): boolean =>
  method === VmModuleRpcMethod.AVALANCHE_SEND_TRANSACTION ||
  method === VmModuleRpcMethod.AVALANCHE_SIGN_TRANSACTION

const getAvalancheChainAliasError = ({
  method,
  params,
  caip2ChainId,
  isTestnet
}: {
  method: VmModuleRpcMethod
  params: unknown
  caip2ChainId: string
  isTestnet: boolean
}): string | undefined => {
  if (!isAvalancheSigningMethod(method)) return undefined

  const chainAlias =
    params && typeof params === 'object' && 'chainAlias' in params
      ? (params as { chainAlias: unknown }).chainAlias
      : undefined

  if (!isAvalancheChainAlias(chainAlias)) {
    return 'avalanche_sendTransaction / avalanche_signTransaction require a chainAlias of X, P, or C'
  }

  const expectedCaip2ChainId = getAvalancheChainAliasCaip2(
    chainAlias,
    isTestnet
  )

  if (caip2ChainId !== expectedCaip2ChainId) {
    // Naming the chains is safe (they're both in the request) and makes the
    // rejection actionable for a legitimate dApp that built the request wrong.
    return `chainAlias '${chainAlias}' does not match the requested chain '${caip2ChainId}'`
  }

  return undefined
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

    const externalXPAddressesResult = await getCachedXPAddresses({
      account,
      walletId,
      walletType,
      isDeveloperMode: isTestnet
    })
    const prefix = chainAlias === 'P' ? 'P' : 'X'

    return {
      xpAddress: currentAddress,
      evmAddress: account.addressC,
      xpubXP,
      externalXPAddresses: Object.entries(
        externalXPAddressesResult.xpAddressDictionary
      ).map(([address, info]) => ({
        index: info.index,
        address: `${prefix}-${address}`
      }))
    }
  }
  return undefined
}
