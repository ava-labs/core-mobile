import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { shallowEqual, useDispatch, useSelector, useStore } from 'react-redux'
import { selectActiveAccount } from 'store/account/slice'
import { selectActiveNetwork, selectAllNetworks } from 'store/network/slice'
import { clearTabChainId, selectTabChainId } from 'store/browser/slices/tabs'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { TabId } from 'store/browser/types'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import RNWebView from 'react-native-webview'
import Logger from 'utils/Logger'
import { createInAppRequest } from 'store/rpc/utils/createInAppRequest'
import { PeerMeta } from 'store/rpc/types'
import { rpcErrors, serializeError } from '@metamask/rpc-errors'
import { RpcMethod } from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { ModuleErrors, VmModuleErrors } from 'vmModule/errors'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { router as appRouter } from 'expo-router'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { approvalController } from 'vmModule/ApprovalController/ApprovalController'
import {
  grantPermission as grantPermissionAction,
  revokePermission as revokePermissionAction,
  selectGrantedAddressesForDomain
} from 'store/permissions/slice'
import type { RootState } from 'store/types'
import type { Account } from 'store/account'
import { buildEvmProviderShim } from './evmProviderShim'
import { getInjectedProviderUuid } from './getInjectedProviderUuid'
import {
  createInjectedProviderRouter,
  InjectedProviderRouter
} from './injectedProvider/router'
import { resolveActiveConnectedAccounts } from './injectedProvider/resolveGrantedAccounts'
import {
  CONNECT_PROMPT_TIMED_OUT_MESSAGE,
  EIP1193_USER_REJECTED_CODE,
  JSON_RPC_INTERNAL_ERROR_CODE,
  USER_REJECTED_REQUEST_MESSAGE
} from './injectedProvider/errors'
import {
  BrowserNetwork,
  DomainMetadata,
  RouterDeps
} from './injectedProvider/types'

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

type UseEvmInjectedProviderResult = {
  providerShimJs: string
  handleProviderMessage: (payload: string) => void
  handleDomainMetadata: (payload: string) => void
  emitEvent: (eventName: string, data: unknown) => void
  dappMetadata: React.RefObject<DomainMetadata | null>
  setCurrentUrl: (url: string) => void
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
): UseEvmInjectedProviderResult {
  const dispatch = useDispatch()
  const store = useStore<RootState>()
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const allNetworks = useSelector(selectAllNetworks, shallowEqual)
  const tabChainId = useSelector(selectTabChainId(tabId))
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
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
    // Non-EVM active network (BTC/SVM/AVM/PVM): the EVM provider can't serve it,
    // so tell the dApp it's disconnected rather than emitting a bogus EVM
    // chainChanged for a non-EVM chainId (EIP-1193 disconnect, code 4901).
    // CP-13671.
    if (activeNetwork.vmName !== NetworkVMType.EVM) {
      // Invalidate the cached EVM chain (sentinel 0 — no real EVM chainId) so
      // returning to the SAME EVM chainId later still re-emits chainChanged.
      // Otherwise the equality guard below would skip it and a dApp that reacted
      // to this disconnect would never get a follow-up event to recover. CP-13671.
      browserNetworkRef.current = { chainId: 0, rpcUrl: '' }
      webViewRef.current?.injectJavaScript(
        `window.__coreProviderEmit && window.__coreProviderEmit('disconnect', { code: 4901, message: 'Disconnected from chain' }); true;`
      )
      return
    }
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

  // When developer (testnet) mode flips, drop any per-tab chain pin so the tab
  // follows the wallet's active network for the NEW environment (the sync effect
  // above then re-points browserNetworkRef + emits chainChanged). Otherwise the
  // tab keeps signing with the prior environment's chainId and the RPC env check
  // rejects every tx with "Invalid environment". CP-13775.
  const prevDevModeRef = useRef(isDeveloperMode)
  useEffect(() => {
    if (prevDevModeRef.current === isDeveloperMode) return
    prevDevModeRef.current = isDeveloperMode
    // Only clear an actual pin — dispatching for an un-pinned tab is a redundant
    // store update + rerender on every dev-mode toggle.
    if (tabChainId !== undefined) dispatch(clearTabChainId({ tabId }))
  }, [isDeveloperMode, dispatch, tabId, tabChainId])

  // Router is assigned below (after useMemo). setCurrentUrl may fire before
  // the router is constructed on first render, so we route through a ref.
  const routerRef = useRef<InjectedProviderRouter | null>(null)

  // primeAccounts is defined later (it reads refs declared further down), so
  // setCurrentUrl's SPA re-prime routes through a ref — same pattern as routerRef.
  const primeAccountsRef = useRef<(() => void) | null>(null)

  // Tracks the reject fn of an in-flight connect approval so a later request
  // or an origin change can unstick it. Also used by requestConnectApproval
  // in the memo below.
  const prevInflightConnectReject = useRef<((err: unknown) => void) | null>(
    null
  )

  const setCurrentUrl = useCallback((url: string) => {
    const prevUrl = currentUrlRef.current
    const prevOrigin = getOriginFromUrl(prevUrl)
    currentUrlRef.current = url
    const newOrigin = getOriginFromUrl(url)

    if (prevOrigin && prevOrigin !== newOrigin) {
      // Cross-origin navigation — cancel in-flight requests and unstick any
      // parked approval tied to the prior page.
      routerRef.current?.cancelByOrigin(newOrigin)
      prevInflightConnectReject.current?.({
        code: EIP1193_USER_REJECTED_CODE,
        message: USER_REJECTED_REQUEST_MESSAGE
      })
      prevInflightConnectReject.current = null
      approvalController.handleGoBackIfNeeded()
    } else if (prevOrigin && prevOrigin === newOrigin && prevUrl !== url) {
      // Same-origin SPA navigation to a new URL (pushState/replaceState) — note
      // prevOrigin must be set, so this excludes the initial page load (which is
      // primed via domain_metadata). The one-time connect/accountsChanged events
      // already fired on first load, so a provider consumer mounted by the new
      // route sees no accounts and appears disconnected. Re-prime so it
      // reconnects. CP-13772.
      primeAccountsRef.current?.()
    }
  }, [])

  const chainIdHex = useMemo(() => {
    if (activeNetwork.vmName !== NetworkVMType.EVM) return '0x1'
    return '0x' + initialChainId.toString(16)
  }, [activeNetwork.vmName, initialChainId])

  const providerShimJs = useMemo(() => {
    return buildEvmProviderShim({
      chainId: chainIdHex,
      uuid: getInjectedProviderUuid()
    })
  }, [chainIdHex])

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

  // Hardened per CP-14159: dApp name + url derive ONLY from the WebView's
  // native top-level URL. The page-supplied domain_metadata cannot influence
  // either field (would be a spoofing vector) — only the favicon is taken
  // from it. When the native URL is unavailable we return a non-Core
  // placeholder so the downstream generateInAppRequestPayload does NOT fall
  // back to CORE_MOBILE_META (which would misattribute the request to
  // https://core.app).
  const getPeerMeta = useCallback((): PeerMeta => {
    const nativeUrl = currentUrlRef.current
    let hostname = ''
    if (nativeUrl) {
      try {
        hostname = new URL(nativeUrl).hostname
      } catch {
        // fall through to placeholder
      }
    }

    // The dApp name and URL are derived ONLY from the WebView's actual
    // top-level URL. The page-supplied domain_metadata cannot influence
    // either (it would be a spoofing vector). The favicon is taken from
    // domain_metadata since it is purely cosmetic. When the native URL is
    // unavailable we return a non-Core placeholder so the downstream
    // generateInAppRequestPayload does NOT fall back to CORE_MOBILE_META
    // (which would misattribute the request to https://core.app).
    const icon = dappMetadata.current?.icon
    return {
      name: hostname || 'Unknown site',
      description: '',
      url: hostname ? nativeUrl : '',
      icons: icon ? [icon] : []
    }
  }, [])

  const activeAccountRef = useRef(activeAccount)

  useEffect(() => {
    activeAccountRef.current = activeAccount
  }, [activeAccount])

  // Last accounts list advertised to the dApp (serialized). Shared by the
  // page-load prime path and the active-account switch effect below so they
  // never emit a duplicate accountsChanged for the same set.
  const lastEmittedAccountsRef = useRef<string | undefined>(undefined)

  // Propagate wallet active-account switches to the dApp. MetaMask users
  // expect the wallet's account selector to drive the dApp's connected
  // account — dApps in the in-app browser have no account picker of their own.
  //   - new active IS granted at this origin → emit [active, ...otherGranted]
  //     (active first) so the dApp follows the wallet.
  //   - new active is NOT granted → emit [] so the dApp reflects a disconnected
  //     state (transacting UI disabled). The injected signer always signs with
  //     the active account, so we must never leave the dApp believing it can
  //     transact as an account that won't actually sign (CP-14382).
  // We don't short-circuit on an empty granted set: a revoke-then-switch (grants
  // cleared via Connected Sites, then the user switches accounts) must still emit
  // accountsChanged([]) to clear the dApp's stale _accounts, matching the prime
  // path. A genuinely never-connected origin is already covered by the prime
  // path's [] emit, so the dedupe below suppresses any redundant emit here.
  useEffect(() => {
    const origin = getOriginFromUrl(currentUrlRef.current)
    if (!origin) return
    const granted = selectGrantedAddressesForDomain({
      domain: origin,
      vmType: NetworkVMType.EVM
    })(store.getState())

    const accounts = resolveActiveConnectedAccounts(
      granted,
      activeAccount?.addressC
    )
    const serialized = JSON.stringify(accounts)
    if (lastEmittedAccountsRef.current === serialized) return
    lastEmittedAccountsRef.current = serialized
    // Origin-gate delivery (same guard as sendResponse): only inject if the page
    // is still on the origin we resolved accounts for, so an account switch
    // racing a cross-origin navigation (briefly-stale currentUrlRef) can't leak
    // one origin's granted addresses to a different page.
    webViewRef.current?.injectJavaScript(
      `if(window.location.origin===${JSON.stringify(
        origin
      )}){window.__coreProviderEmit && window.__coreProviderEmit('accountsChanged', ${serialized})};true;`
    )
  }, [activeAccount, store, webViewRef])

  // Connected Sites revokes a dApp from another screen without changing this
  // tab's active account, so only a store subscription can react (CP-14382).
  useEffect(() => {
    let prevGrants = store.getState().permissions.grants
    return store.subscribe(() => {
      // store.subscribe fires on every dispatch — bail unless grants changed.
      const grants = store.getState().permissions.grants
      if (grants === prevGrants) return
      prevGrants = grants

      const origin = getOriginFromUrl(currentUrlRef.current)
      if (!origin) return

      // What this origin may transact as now: active-first, or [] if the active
      // account is no longer granted.
      const granted = selectGrantedAddressesForDomain({
        domain: origin,
        vmType: NetworkVMType.EVM
      })(store.getState())
      const accounts = resolveActiveConnectedAccounts(
        granted,
        activeAccountRef.current?.addressC
      )

      // Shared dedupe ref so this never double-fires with the switch/prime paths.
      const serialized = JSON.stringify(accounts)
      if (lastEmittedAccountsRef.current === serialized) return
      lastEmittedAccountsRef.current = serialized
      webViewRef.current?.injectJavaScript(
        `window.__coreProviderEmit && window.__coreProviderEmit('accountsChanged', ${serialized}); true;`
      )
    })
  }, [store, webViewRef])

  // When this browser tab unmounts (tab closed), reject any parked connect
  // approval with 4001 so the dApp's eth_requestAccounts promise settles instead
  // of hanging until supersede or the 90s timeout. Inactive tabs stay mounted
  // when switching tabs, so this does not run on tab switch.
  useEffect(() => {
    return () => {
      prevInflightConnectReject.current?.({
        code: EIP1193_USER_REJECTED_CODE,
        message: USER_REJECTED_REQUEST_MESSAGE
      })
      prevInflightConnectReject.current = null
    }
  }, [])

  const requestConnectApproval = useCallback(
    (peerMeta: PeerMeta): Promise<Account[]> => {
      // If a prior connect is still parked (screen never mounted, or a second
      // request arrived before the first resolved), reject it so its dApp can
      // unstick. Then replace the cache entry with our own settled-guarded
      // callbacks.
      prevInflightConnectReject.current?.({
        code: EIP1193_USER_REJECTED_CODE,
        message: USER_REJECTED_REQUEST_MESSAGE
      })
      prevInflightConnectReject.current = null

      return new Promise<Account[]>((resolve, reject) => {
        let settled = false
        const safeResolve = (selected: Account[]): void => {
          if (settled) return
          settled = true
          // Only clear if the ref still points to THIS request's handler — a
          // newer in-flight request would have overwritten it, and we must not
          // clobber that one.
          if (prevInflightConnectReject.current === safeReject) {
            prevInflightConnectReject.current = null
          }
          resolve(selected)
          // fallbackTimer would be no op, no need to maintain
          clearTimeout(fallbackTimer)
        }
        const safeReject = (err: unknown): void => {
          if (settled) return
          settled = true
          // Only clear if the ref still points to THIS request's handler — a
          // newer in-flight request would have overwritten it, and we must not
          // clobber that one.
          if (prevInflightConnectReject.current === safeReject) {
            prevInflightConnectReject.current = null
          }
          reject(err)
          // fallbackTimer would be no op, no need to maintain
          clearTimeout(fallbackTimer)
        }
        prevInflightConnectReject.current = safeReject

        walletConnectCache.injectedAuthParams.set({
          peerMeta,
          onApprove: safeResolve,
          onReject: () =>
            safeReject({
              code: EIP1193_USER_REJECTED_CODE,
              message: USER_REJECTED_REQUEST_MESSAGE
            })
        })
        appRouter.navigate('/authorizeInjectedDapp')

        // Safety net: if the screen never mounts or calls back within 90s,
        // reject so the dApp can surface an error instead of hanging.
        const fallbackTimer = setTimeout(() => {
          safeReject({
            code: JSON_RPC_INTERNAL_ERROR_CODE,
            message: CONNECT_PROMPT_TIMED_OUT_MESSAGE
          })
        }, CONNECT_APPROVAL_TIMEOUT_MS)
      })
    },
    []
  )

  const router = useMemo(() => {
    // requestSigning closes over dispatch + store.getState (the latter was
    // added in CP-14159 so the in-app request payload can read the current
    // network state). Construct inside the memo so it always picks up the
    // latest references and rebuilds when dispatch changes.
    const requestSigning = createInAppRequest(dispatch, store.getState)

    // Read-only RPC goes through the VM module — the same `module.onRpcRequest`
    // path WalletConnect uses — so method classification and proxying come from
    // the module manifest rather than a hand-maintained allowlist + raw fetch
    // (CP-14384). Uses the per-tab browser network (which can diverge from the
    // wallet's active network via wallet_switchEthereumChain), not the active one.
    const requestReadOnly: RouterDeps['requestReadOnly'] = async ({
      id,
      method,
      params,
      chainId
    }) => {
      // Prefer the ref (avoids re-allocating the merged network map on every
      // read-only call — a hot path for polling dApps). Fall back to the store
      // only on a miss: a chain just added via wallet_addEthereumChain that
      // Redux has but the ref hasn't picked up yet. That keeps the common path
      // allocation-free while still closing the stale-ref race.
      const network =
        allNetworksRef.current[chainId] ??
        selectAllNetworks(store.getState())[chainId]
      if (!network) {
        throw rpcErrors.internal(`No network configured for chain ${chainId}`)
      }
      const caip2 = getEvmCaip2ChainId(chainId)
      let module
      try {
        module = await ModuleManager.loadModule(caip2, method)
      } catch (e) {
        // Only an unsupported-method manifest rejection maps to methodNotFound;
        // anything else (unsupported chainId, module init failure) is a real
        // internal error and must not masquerade as -32601.
        if (
          e instanceof VmModuleErrors &&
          e.name === ModuleErrors.UNSUPPORTED_METHOD
        ) {
          throw rpcErrors.methodNotFound(`Unsupported method: ${method}`)
        }
        Logger.error('[InjectedProvider] read-only module load failed', e)
        throw rpcErrors.internal('Failed to load module for read-only request')
      }
      const peerMeta = getPeerMeta()
      const response = await module.onRpcRequest(
        {
          requestId: String(id),
          sessionId: String(tabId),
          // Read-only methods aren't members of the RpcMethod (signing) enum,
          // but the module proxies them at runtime — same cast the WC path makes.
          method: method as RpcMethod,
          chainId: caip2,
          params,
          dappInfo: {
            name: peerMeta.name,
            url: peerMeta.url,
            icon: peerMeta.icons[0] ?? ''
          }
        },
        mapToVmNetwork(network)
      )
      if ('error' in response) {
        throw response.error
      }
      return response.result
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
      requestReadOnly,
      sendResponse,
      emitEvent,
      getNativeOrigin: () => getOriginFromUrl(currentUrlRef.current),
      trackPendingOrigin: (id, origin) => {
        pendingOrigins.current.set(id, origin)
      },
      getPeerMeta,
      getActiveAccount: () => activeAccountRef.current,
      getGrantedAddresses: ({ domain, vmType }) =>
        selectGrantedAddressesForDomain({ domain, vmType })(store.getState()),
      grantPermission: ({ domain, address, vmType }) =>
        dispatch(grantPermissionAction({ domain, address, vmType })),
      revokePermission: ({ domain, address, vmType }) =>
        dispatch(revokePermissionAction({ domain, address, vmType })),
      requestConnectApproval
    })
  }, [
    dispatch,
    store,
    tabId,
    sendResponse,
    emitEvent,
    getPeerMeta,
    requestConnectApproval
  ])

  // Publish the router to the ref so setCurrentUrl (defined above, fires on nav
  // events) can call cancelByOrigin. useLayoutEffect (not useEffect) so the ref
  // is populated synchronously on commit, before any WebView navigation event
  // can fire — otherwise an early cross-origin nav could run setCurrentUrl with
  // a null ref and silently skip the security-sensitive cancellation.
  useLayoutEffect(() => {
    routerRef.current = router
  }, [router])

  const handleProviderMessage = useCallback(
    (payload: string) => router.handleProviderMessage(payload),
    [router]
  )

  // Emit accountsChanged for the current origin's connected accounts: the
  // granted addresses (active first) when the active account is granted,
  // otherwise [] (CP-14382). Shared by page-load priming (handleDomainMetadata)
  // and same-origin SPA navigation (setCurrentUrl, via primeAccountsRef) so a
  // freshly-mounted provider consumer on a new route re-establishes the
  // connection. The injected signer always signs with the active account, so
  // priming the granted set while an ungranted account is active would
  // re-establish a phantom connection — emit [] instead.
  const primeAccounts = useCallback(() => {
    const origin = getOriginFromUrl(currentUrlRef.current)
    const active = activeAccountRef.current
    if (!origin || !active?.addressC) return
    const granted = selectGrantedAddressesForDomain({
      domain: origin,
      vmType: NetworkVMType.EVM
    })(store.getState())
    const accounts = resolveActiveConnectedAccounts(granted, active.addressC)
    lastEmittedAccountsRef.current = JSON.stringify(accounts)
    webViewRef.current?.injectJavaScript(
      `window.__coreProviderEmit && window.__coreProviderEmit('accountsChanged', ${JSON.stringify(
        accounts
      )}); true;`
    )
  }, [store, webViewRef])
  // Publish to the ref so setCurrentUrl (defined above) can re-prime on SPA nav.
  // useLayoutEffect (not a render-phase assignment) to match routerRef: the ref
  // must be set synchronously on commit, before a navigation event can fire
  // setCurrentUrl and read it.
  useLayoutEffect(() => {
    primeAccountsRef.current = primeAccounts
  }, [primeAccounts])

  const handleDomainMetadata = useCallback(
    (payload: string) => {
      try {
        dappMetadata.current = JSON.parse(payload)
        Logger.trace('[InjectedProvider] domain_metadata', dappMetadata.current)
      } catch {
        Logger.error('[InjectedProvider] Invalid domain_metadata payload')
      }
      // Prime the shim's _accounts cache on page load so dApps with
      // auto-reconnect (wagmi autoConnect, etc.) see the connection immediately.
      primeAccounts()
    },
    [primeAccounts]
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
