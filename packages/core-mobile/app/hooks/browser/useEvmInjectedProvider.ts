import { useCallback, useEffect, useMemo, useRef } from 'react'
import { shallowEqual, useDispatch, useSelector, useStore } from 'react-redux'
import { selectActiveAccount } from 'store/account/slice'
import { selectActiveNetwork, selectAllNetworks } from 'store/network/slice'
import { selectTabChainId } from 'store/browser/slices/tabs'
import { TabId } from 'store/browser/types'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import RNWebView from 'react-native-webview'
import Logger from 'utils/Logger'
import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
import { PeerMeta } from 'store/rpc/types'
import { serializeError } from '@metamask/rpc-errors'
import { router as appRouter } from 'expo-router'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import {
  grantPermission as grantPermissionAction,
  revokePermission as revokePermissionAction,
  selectHasPermission
} from 'store/permissions/slice'
import type { RootState } from 'store/types'
import type { Account } from 'store/account'
import { buildEvmProviderShim } from './evmProviderShim'
import { getInjectedProviderUuid } from './getInjectedProviderUuid'
import { createInjectedProviderRouter } from './injectedProvider/router'
import {
  BrowserNetwork,
  DomainMetadata,
  MAX_MESSAGE_SIZE as ROUTER_MAX_MESSAGE_SIZE
} from './injectedProvider/types'

export const MAX_MESSAGE_SIZE = ROUTER_MAX_MESSAGE_SIZE

// If the connect-approval screen never mounts or never resolves (e.g. Metro
// hot-reloaded the cache, the page crashed mid-navigation, etc.), reject the
// parked promise after this interval so the dApp can surface an error and
// the user isn't stuck with a spinning button.
const CONNECT_APPROVAL_TIMEOUT_MS = 90_000

function getOriginFromUrl(url: string): string | undefined {
  if (!url) return undefined
  try {
    const origin = new URL(url).origin
    return origin !== 'null' ? origin : undefined
  } catch {
    return undefined
  }
}

/**
 * Hook providing EVM injected provider functionality for the in-app browser.
 *
 * Signing methods (personal_sign, eth_sendTransaction, etc.) are dispatched
 * through the existing RPC system which shows the approval screen.
 * Read-only methods are proxied directly to the network RPC endpoint.
 */
export function useEvmInjectedProvider(
  webViewRef: React.RefObject<RNWebView | null>,
  tabId: TabId
) {
  const dispatch = useDispatch()
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const allNetworks = useSelector(selectAllNetworks, shallowEqual)
  const tabChainId = useSelector(selectTabChainId(tabId))
  const dappMetadata = useRef<DomainMetadata | null>(null)
  const currentUrlRef = useRef<string>('')
  const pendingOrigins = useRef<Map<number, string>>(new Map())
  const initialChainId = tabChainId ?? activeNetwork.chainId
  const initialNetwork = allNetworks[initialChainId] ?? activeNetwork
  const browserNetworkRef = useRef<BrowserNetwork>({
    chainId: initialChainId,
    rpcUrl: initialNetwork.rpcUrl
  })

  // Refs kept current so the stable router can read latest values via getters
  const allNetworksRef = useRef(allNetworks)
  useEffect(() => {
    allNetworksRef.current = allNetworks
  }, [allNetworks])

  // When the tab has no persisted chainId, keep browserNetworkRef in sync with
  // the global active network so read-only RPC and signing requests are routed
  // to the correct chain after the user switches networks wallet-wide.
  useEffect(() => {
    if (tabChainId !== undefined) return
    if (browserNetworkRef.current.chainId === activeNetwork.chainId) return
    browserNetworkRef.current = {
      chainId: activeNetwork.chainId,
      rpcUrl: activeNetwork.rpcUrl
    }
    const hexChainId = '0x' + activeNetwork.chainId.toString(16)
    webViewRef.current?.injectJavaScript(
      `window.__coreProviderEmit('chainChanged', '${hexChainId}'); true;`
    )
  }, [activeNetwork, tabChainId, webViewRef])

  const setCurrentUrl = useCallback((url: string) => {
    currentUrlRef.current = url
  }, [])

  const chainIdHex = useMemo(() => {
    if (activeNetwork.vmName !== NetworkVMType.EVM) return '0x1'
    return '0x' + initialChainId.toString(16)
  }, [activeNetwork.vmName, initialChainId])

  const evmAddress = activeAccount?.addressC ?? ''

  const providerShimJs = useMemo(() => {
    return buildEvmProviderShim({
      chainId: chainIdHex,
      address: evmAddress,
      uuid: getInjectedProviderUuid()
    })
  }, [chainIdHex, evmAddress])

  const sendResponse = useCallback(
    (id: number, error: unknown, result: unknown) => {
      let errorPayload: { code: number; message: string } | null = null
      if (error != null) {
        const err = error as Record<string, unknown>
        if (
          typeof err.code === 'number' &&
          Number.isInteger(err.code) &&
          typeof err.message === 'string'
        ) {
          errorPayload = {
            code: err.code,
            message: err.message
          }
        } else {
          const serialized = serializeError(error, {
            shouldIncludeStack: false
          })
          errorPayload = {
            code: serialized.code,
            message: serialized.message
          }
        }
      }
      const errorJson = errorPayload ? JSON.stringify(errorPayload) : 'null'
      const resultJson = result !== undefined ? JSON.stringify(result) : 'null'
      const call = `window.__coreProviderRespond(${id}, ${errorJson}, ${resultJson});`

      const expectedOrigin = pendingOrigins.current.get(id)
      pendingOrigins.current.delete(id)

      // Gate response delivery: if we recorded the page origin at request
      // time, only deliver if the page is still on the same origin
      // (prevents leaking response data after cross-origin navigation).
      const js = expectedOrigin
        ? `if(window.location.origin===${JSON.stringify(
            expectedOrigin
          )}){${call}}true;`
        : `${call} true;`

      webViewRef.current?.injectJavaScript(js)
    },
    [webViewRef]
  )

  const emitEvent = useCallback(
    (eventName: string, data: unknown) => {
      const dataJson = JSON.stringify(data)
      const js = `window.__coreProviderEmit('${eventName}', ${dataJson}); true;`
      webViewRef.current?.injectJavaScript(js)
    },
    [webViewRef]
  )

  const getPeerMeta = useCallback((): PeerMeta | undefined => {
    const meta = dappMetadata.current
    const nativeUrl = currentUrlRef.current
    if (!meta && !nativeUrl) return undefined

    return {
      name: meta?.name ?? new URL(nativeUrl).hostname,
      description: '',
      url: nativeUrl || meta?.url || '',
      icons: meta?.icon ? [meta.icon] : []
    }
  }, [])

  const store = useStore<RootState>()
  const activeAccountRef = useRef(activeAccount)
  useEffect(() => {
    activeAccountRef.current = activeAccount
  }, [activeAccount])

  // Tracks the reject fn of an in-flight connect approval so a later request
  // (or an unmount) can unstick it. Writes and clears happen only inside
  // requestConnectApproval.
  const prevInflightConnectReject = useRef<((err: unknown) => void) | null>(
    null
  )

  const router = useMemo(() => {
    // requestSigning closes over dispatch; keep its construction inside the
    // memo so it always uses the latest dispatch and re-builds when dispatch
    // changes (gated via the dep array below).
    const requestSigning = createInAppRequest(dispatch)

    const requestConnectApproval = (peerMeta: PeerMeta): Promise<Account[]> => {
      // If a prior connect is still parked (screen never mounted, or a second
      // request arrived before the first resolved), reject it so its dApp can
      // unstick. Then replace the cache entry with our own settled-guarded
      // callbacks.
      prevInflightConnectReject.current?.({
        code: 4001,
        message: 'User rejected the request.'
      })
      prevInflightConnectReject.current = null

      return new Promise<Account[]>((resolve, reject) => {
        let settled = false
        const safeResolve = (selected: Account[]): void => {
          if (settled) return
          settled = true
          if (prevInflightConnectReject.current === reject) {
            prevInflightConnectReject.current = null
          }
          resolve(selected)
        }
        const safeReject = (err: unknown): void => {
          if (settled) return
          settled = true
          if (prevInflightConnectReject.current === reject) {
            prevInflightConnectReject.current = null
          }
          reject(err)
        }
        prevInflightConnectReject.current = safeReject

        walletConnectCache.injectedAuthParams.set({
          peerMeta,
          onApprove: safeResolve,
          onReject: () =>
            safeReject({
              code: 4001,
              message: 'User rejected the request.'
            })
        })
        appRouter.navigate('/authorizeInjectedDapp')

        // Safety net: if the screen never mounts or calls back within 90s,
        // reject so the dApp can surface an error instead of hanging.
        setTimeout(() => {
          safeReject({
            code: -32603,
            message: 'Connect prompt timed out'
          })
        }, CONNECT_APPROVAL_TIMEOUT_MS)
      })
    }

    return createInjectedProviderRouter({
      getBrowserNetwork: () => browserNetworkRef.current,
      setBrowserNetwork: net => {
        browserNetworkRef.current = net
      },
      getAllNetworks: () => allNetworksRef.current,
      tabId,
      dispatch,
      requestSigning,
      sendResponse,
      emitEvent,
      getNativeOrigin: () => getOriginFromUrl(currentUrlRef.current),
      trackPendingOrigin: (id, origin) => {
        pendingOrigins.current.set(id, origin)
      },
      getPeerMeta,
      getActiveAccount: () => activeAccountRef.current,
      hasPermission: ({ domain, address, vmType }) =>
        selectHasPermission({ domain, address, vmType })(store.getState()),
      grantPermission: ({ domain, address, vmType }) =>
        dispatch(grantPermissionAction({ domain, address, vmType })),
      revokePermission: ({ domain, address, vmType }) =>
        dispatch(
          revokePermissionAction({ domain, address, vmType })
        ),
      requestConnectApproval
    })
  }, [dispatch, tabId, sendResponse, emitEvent, getPeerMeta, store])

  const handleProviderMessage = useCallback(
    (payload: string) => router.handleProviderMessage(payload),
    [router]
  )

  const handleDomainMetadata = useCallback(
    (payload: string) => {
      try {
        dappMetadata.current = JSON.parse(payload)
        Logger.trace('[InjectedProvider] domain_metadata', dappMetadata.current)
      } catch {
        Logger.error('[InjectedProvider] Invalid domain_metadata payload')
      }

      // Prime the shim's _accounts cache on page load: if the current origin
      // already has an EVM grant for the active account, emit accountsChanged
      // so dApps with auto-reconnect (wagmi autoConnect, etc.) see the
      // connection immediately without prompting. If no grant exists, emit
      // an empty array to keep the shim in sync (e.g. after the user revoked
      // the grant from Connected Sites while the tab was open).
      const origin = getOriginFromUrl(currentUrlRef.current)
      const active = activeAccountRef.current
      if (!origin || !active?.addressC) return
      const granted = selectHasPermission({
        domain: origin,
        address: active.addressC,
        vmType: NetworkVMType.EVM
      })(store.getState())
      const accounts = granted ? [active.addressC] : []
      webViewRef.current?.injectJavaScript(
        `window.__coreProviderEmit && window.__coreProviderEmit('accountsChanged', ${JSON.stringify(
          accounts
        )}); true;`
      )
    },
    [store, webViewRef]
  )

  return {
    providerShimJs,
    handleProviderMessage,
    handleDomainMetadata,
    emitEvent,
    dappMetadata,
    setCurrentUrl
  }
}
