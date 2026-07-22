import {
  PerpsEnvironment,
  createPerpsManager,
  type Address,
  type PerpsManager
} from '@avalabs/perps-sdk'
import { useQueryClient } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import Logger from 'utils/Logger'
import { useAgentWallet } from '../agent/useAgentWallet'
import {
  usePerpsConnectionMonitor,
  type PerpsConnectionStatus
} from '../hooks/usePerpsConnectionMonitor'

export type PerpsContextValue = {
  readonly manager: PerpsManager | null
  readonly ready: boolean
  readonly error: Error | null
  readonly retryInit: () => void
  readonly userAddress: Address | undefined
  /** True when a background-trading agent key exists for the active account. */
  readonly hasAgent: boolean
  /** True while the stored agent key is being loaded — `hasAgent` is not yet meaningful. */
  readonly isLoadingAgent: boolean
  readonly isAgentApprovalSubmitting: boolean
  /** Prompt the master wallet once to approve a background-trading agent. */
  readonly approveBackgroundTrading: () => Promise<void>
  /** Clear the stored agent key so a fresh approval can be requested. */
  readonly invalidateSessionAgent: () => Promise<void>
  /**
   * Bumped after any out-of-band balance mutation (deposit, withdraw, trade).
   * Clearinghouse/positions hooks include it in their deps to re-fetch together.
   */
  readonly clearinghouseRefreshNonce: number
  readonly refreshClearinghouse: () => void
  /** After a trade: bump nonce + invalidate all perps queries. */
  readonly refreshAfterTrade: () => void
  /** After deposit/withdraw: bump nonce + refetch C-Chain balances. */
  readonly refreshAllBalances: () => void
  /** Best-effort perps WebSocket health (see `usePerpsConnectionMonitor`). */
  readonly connectionStatus: PerpsConnectionStatus
  /**
   * Bumped when the connection monitor wants live feeds to re-subscribe after a
   * sustained WS stall. The mids feed includes it in its effect deps.
   */
  readonly wsResubscribeNonce: number
  /**
   * Register a live perps consumer. The Hyperliquid manager + WebSocket are
   * only created while at least one consumer is mounted, so signed-in users who
   * never open perps pay no init/WS/agent cost. Returns an unregister fn; call
   * it on unmount. `usePerps` wires this up automatically for every consumer.
   */
  readonly activate: () => () => void
}

const PerpsContext = createContext<PerpsContextValue | null>(null)

export function usePerps(): PerpsContextValue {
  const ctx = useContext(PerpsContext)
  if (ctx === null) {
    throw new Error('usePerps must be used within a PerpsProvider')
  }
  // Any consumer mounting marks perps as "in use", which lazily boots the
  // manager + WebSocket; unmounting releases it (ref-counted in the provider).
  const { activate } = ctx
  useEffect(() => activate(), [activate])
  return ctx
}

export function PerpsProvider({
  children
}: {
  children: ReactNode
}): JSX.Element {
  const queryClient = useQueryClient()
  const activeAccount = useSelector(selectActiveAccount)
  const userAddress = activeAccount?.addressC as Address | undefined

  // Lazy activation: nothing boots until a perps consumer mounts (see `usePerps`
  // / `activate`). Ref-counted so the manager + WS survive while any consumer is
  // mounted and tear down once the last one unmounts.
  const activeCountRef = useRef(0)
  const [activated, setActivated] = useState(false)
  const activate = useCallback((): (() => void) => {
    activeCountRef.current += 1
    setActivated(true)
    return () => {
      activeCountRef.current -= 1
      if (activeCountRef.current <= 0) {
        activeCountRef.current = 0
        setActivated(false)
      }
    }
  }, [])

  const {
    perpsSigner,
    hasAgent,
    isApproving,
    isLoadingAgent,
    approve,
    invalidateAndReprompt
  } = useAgentWallet(userAddress, activated)

  const [manager, setManager] = useState<PerpsManager | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [initAttempt, setInitAttempt] = useState(0)
  const [clearinghouseRefreshNonce, setClearinghouseRefreshNonce] = useState(0)
  const [wsResubscribeNonce, setWsResubscribeNonce] = useState(0)

  const bumpWsResubscribe = useCallback(
    () => setWsResubscribeNonce(n => n + 1),
    []
  )
  const connectionStatus = usePerpsConnectionMonitor(ready, bumpWsResubscribe)

  const retryInit = useCallback(() => setInitAttempt(n => n + 1), [])
  const refreshClearinghouse = useCallback(
    () => setClearinghouseRefreshNonce(n => n + 1),
    []
  )

  const refreshAfterTrade = useCallback(() => {
    setClearinghouseRefreshNonce(n => n + 1)
    void queryClient.invalidateQueries({
      queryKey: [ReactQueryKeys.PERPS_POSITIONS]
    })
    void queryClient.invalidateQueries({
      queryKey: [ReactQueryKeys.PERPS_OPEN_ORDERS]
    })
    void queryClient.invalidateQueries({
      queryKey: [ReactQueryKeys.PERPS_CLEARINGHOUSE]
    })
  }, [queryClient])

  const refreshAllBalances = useCallback(() => {
    setClearinghouseRefreshNonce(n => n + 1)
    void queryClient.refetchQueries({
      queryKey: [ReactQueryKeys.ACCOUNT_BALANCE]
    })
  }, [queryClient])

  useEffect(() => {
    void initAttempt
    // No live consumer → stay dormant (no manager, no WebSocket, no agent work).
    if (!activated) {
      setManager(null)
      setReady(false)
      return
    }
    // Wait until the agent key finished loading so we init once with the
    // resolved signer (agent key if present, else the master-wallet fallback)
    // instead of creating the manager twice.
    if (isLoadingAgent || perpsSigner === undefined) {
      setManager(null)
      setReady(false)
      return
    }
    const signer = perpsSigner

    // Drop the previous manager immediately when the signer changes (e.g. right
    // after agent approve). Otherwise place-order can still use the stale
    // master-wallet exchange client and L1 sigs recover a non-agent address.
    setManager(null)
    setReady(false)

    let cancelled = false
    let created: PerpsManager | undefined

    async function run(): Promise<void> {
      setError(null)
      try {
        const m = await createPerpsManager({
          environment: PerpsEnvironment.Mainnet,
          signer
        })
        created = m
        await m.init()
        if (cancelled) {
          m.ws.disconnect()
          return
        }
        setManager(m)
        setReady(true)
        Logger.info('[PerpsProvider] manager ready', {
          signer: signer.address
        })
      } catch (e) {
        Logger.error('[PerpsProvider] init failed', e)
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)))
        }
      }
    }

    void run()

    return () => {
      cancelled = true
      created?.ws.disconnect()
    }
  }, [activated, perpsSigner, isLoadingAgent, initAttempt])

  const value = useMemo<PerpsContextValue>(
    () => ({
      manager,
      ready,
      error,
      retryInit,
      userAddress,
      hasAgent,
      isLoadingAgent,
      isAgentApprovalSubmitting: isApproving,
      approveBackgroundTrading: approve,
      invalidateSessionAgent: invalidateAndReprompt,
      clearinghouseRefreshNonce,
      refreshClearinghouse,
      refreshAfterTrade,
      refreshAllBalances,
      connectionStatus,
      wsResubscribeNonce,
      activate
    }),
    [
      manager,
      ready,
      error,
      retryInit,
      userAddress,
      hasAgent,
      isLoadingAgent,
      isApproving,
      approve,
      invalidateAndReprompt,
      clearinghouseRefreshNonce,
      refreshClearinghouse,
      refreshAfterTrade,
      refreshAllBalances,
      connectionStatus,
      wsResubscribeNonce,
      activate
    ]
  )

  return <PerpsContext.Provider value={value}>{children}</PerpsContext.Provider>
}
