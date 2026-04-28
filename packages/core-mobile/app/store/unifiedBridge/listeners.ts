import { bigIntToHex } from '@ethereumjs/util'
import { isAnyOf } from '@reduxjs/toolkit'
import {
  BridgeType,
  BtcSigner,
  Environment,
  EvmSigner,
  Hex
} from '@avalabs/bridge-unified'
import { TransactionParams } from '@avalabs/evm-module'
import { RpcMethod } from '@avalabs/vm-module-types'
import { AppListenerEffectAPI, AppStartListening, RootState } from 'store/types'
import { onAppUnlocked, selectWalletState } from 'store/app/slice'
import { WalletState } from 'store/app/types'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced/slice'
import { createInAppRequest, Request } from 'store/rpc/utils/createInAppRequest'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import { getBitcoinCaip2ChainId, getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { RequestContext } from 'store/rpc/types'
import UnifiedBridgeService from 'services/bridge/UnifiedBridgeService'

// Hardcoded list of bridge types the SDK should know about so that
// `analyzeTx` can recognise historical bridge transactions across all
// supported types. Mirrors core-extension PR #902.
const ENABLED_BRIDGE_TYPES: BridgeType[] = [
  BridgeType.CCTP,
  BridgeType.ICTT_ERC20_ERC20,
  BridgeType.AVALANCHE_EVM,
  BridgeType.LOMBARD_BTC_TO_BTCB,
  BridgeType.LOMBARD_BTCB_TO_BTC
]

const createEvmSigner = (request: Request): EvmSigner => ({
  sign: async (
    { data, from, to, value, chainId },
    _,
    { currentSignature, requiredSignatures }
  ) => {
    if (typeof to !== 'string') throw new Error('invalid to field')
    const txParams: [TransactionParams] = [
      {
        from,
        to,
        data: data ?? undefined,
        value: typeof value === 'bigint' ? bigIntToHex(value) : undefined
      }
    ]

    return request({
      method: RpcMethod.ETH_SEND_TRANSACTION,
      params: txParams,
      chainId: getEvmCaip2ChainId(Number(chainId)),
      context: {
        // we only want to show confetti for the final approval
        [RequestContext.CONFETTI_DISABLED]:
          requiredSignatures > currentSignature
      }
    }) as Promise<Hex>
  }
})

const initUnifiedBridgeService = async (
  _action: unknown,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const state = listenerApi.getState()
  const walletState = selectWalletState(state)

  if (walletState !== WalletState.ACTIVE) return

  const request = createInAppRequest(listenerApi.dispatch, listenerApi.getState)

  if (UnifiedBridgeService.isInitialized()) {
    const prevState = listenerApi.getOriginalState()
    if (!shouldReinitializeBridge(prevState, state)) return
  }

  const isTest = selectIsDeveloperMode(state)
  const bitcoinProvider = await getBitcoinProvider(isTest)

  const request = createInAppRequest(listenerApi.dispatch)
  const evmSigner = createEvmSigner(request)
  const btcSigner: BtcSigner = {
    sign: async (txData, _, { requiredSignatures, currentSignature }) =>
      request({
        method: RpcMethod.BITCOIN_SIGN_TRANSACTION,
        params: txData,
        chainId: getBitcoinCaip2ChainId(!isTest),
        context: {
          [RequestContext.CONFETTI_DISABLED]:
            requiredSignatures > currentSignature
        }
      })
  }

  await UnifiedBridgeService.init({
    enabledBridgeTypes: ENABLED_BRIDGE_TYPES,
    evmSigner,
    btcSigner,
    bitcoinProvider,
    environment: isTest ? Environment.TEST : Environment.PROD
  })
}

// Re-init only when developer mode flips (TEST <-> PROD environment).
const shouldReinitializeBridge = (
  prevState: RootState,
  currState: RootState
): boolean =>
  selectIsDeveloperMode(prevState) !== selectIsDeveloperMode(currState)

export const addUnifiedBridgeListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    matcher: isAnyOf(onAppUnlocked, toggleDeveloperMode),
    effect: initUnifiedBridgeService
  })
}
