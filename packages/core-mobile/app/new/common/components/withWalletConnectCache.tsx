import React, { useState, useLayoutEffect, useRef } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import Logger from 'utils/Logger'

type WalletConnectKey = keyof typeof walletConnectCache

type CacheEntry<K extends WalletConnectKey> = typeof walletConnectCache[K]

type IsKeyedCache<C> = C extends { get: (id: string) => unknown } ? true : false

type InferParamType<K extends WalletConnectKey> = IsKeyedCache<
  CacheEntry<K>
> extends true
  ? ReturnType<typeof walletConnectCache[K]['get']>
  : ReturnType<typeof walletConnectCache[K]['get']>

function readCacheEntry<K extends WalletConnectKey>(
  key: K,
  requestIdParam: string | undefined,
  requestId: string | undefined
): InferParamType<K> {
  const cache = walletConnectCache[key]
  if (requestIdParam && 'get' in cache) {
    if (!requestId) throw new Error(`Missing ${requestIdParam} route param`)
    return (cache as unknown as { get: (id: string) => InferParamType<K> }).get(
      requestId
    )
  }
  return (cache as unknown as { get: () => InferParamType<K> }).get()
}

type Settleable = {
  onApprove?: (...args: never[]) => unknown
  onReject?: (message?: string) => void
}

type PendingRequest = { settled: boolean; reject?: (message?: string) => void }

function trackSettlement<T>(entry: T, pending: PendingRequest): T {
  const settleable = entry as unknown as Settleable
  if (typeof settleable?.onReject !== 'function') return entry
  const { onApprove, onReject } = settleable
  pending.reject = onReject
  return {
    ...entry,
    ...(typeof onApprove === 'function' && {
      onApprove: (...args: never[]) => {
        pending.settled = true
        return onApprove(...args)
      }
    }),
    onReject: (message?: string) => {
      pending.settled = true
      onReject(message)
    }
  }
}

export function withWalletConnectCache<K extends WalletConnectKey>(
  key: K,
  options?: { requestIdParam?: string }
) {
  return function <P extends { params: InferParamType<K> }>(
    WrappedComponent: React.ComponentType<P>
  ) {
    return function WalletConnectCacheWrapper(
      props: Omit<P, 'params'>
    ): JSX.Element | null {
      const searchParams = useLocalSearchParams()
      // Tagged with the id it was read for, so a render between an id change
      // and the effect below never shows the previous request's params.
      const [loaded, setLoaded] = useState<{
        id: string | undefined
        params: InferParamType<K>
      } | null>(null)
      const requestIdValue = options?.requestIdParam
        ? (searchParams[options.requestIdParam] as string | undefined)
        : undefined

      const pendingRef = useRef<PendingRequest | null>(null)

      useLayoutEffect(() => {
        // Reject the superseded request unless already settled (an in-flight
        // approval counts), or its dApp waits forever.
        const previous = pendingRef.current
        pendingRef.current = null
        if (previous && !previous.settled) previous.reject?.()

        try {
          const pending: PendingRequest = { settled: false }
          const entry = trackSettlement(
            readCacheEntry(key, options?.requestIdParam, requestIdValue),
            pending
          )
          pendingRef.current = pending
          setLoaded({ id: requestIdValue, params: entry })
        } catch (err) {
          Logger.error('Error getting wallet connect cache', err)
          setLoaded(null)
        }
      }, [requestIdValue])

      if (!loaded || loaded.id !== requestIdValue) return null

      // Key by request id to remount and drop carried-over state.
      return (
        <WrappedComponent
          key={requestIdValue}
          {...(props as P)}
          params={loaded.params}
        />
      )
    }
  }
}
