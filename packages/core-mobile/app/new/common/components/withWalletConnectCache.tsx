import React, { useState, useLayoutEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import Logger from 'utils/Logger'

type WalletConnectKey = keyof typeof walletConnectCache

type CacheEntry<K extends WalletConnectKey> = (typeof walletConnectCache)[K]

// Distinguish singleton caches (get()) from keyed caches (get(id))
type IsKeyedCache<C> = C extends { get: (id: string) => unknown } ? true : false

type InferParamType<K extends WalletConnectKey> =
  IsKeyedCache<CacheEntry<K>> extends true
    ? ReturnType<(typeof walletConnectCache)[K]['get']>
    : ReturnType<(typeof walletConnectCache)[K]['get']>

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
      const [params, setParams] = useState<InferParamType<K> | null>(null)

      useLayoutEffect(() => {
        try {
          const cache = walletConnectCache[key]
          const requestIdParam = options?.requestIdParam
          let data: InferParamType<K>
          if (requestIdParam && 'get' in cache) {
            const id = searchParams[requestIdParam] as string | undefined
            if (!id) throw new Error(`Missing ${requestIdParam} route param`)
            // keyed cache: pass the id
            data = (
              cache as unknown as { get: (id: string) => InferParamType<K> }
            ).get(id)
          } else {
            data = (cache as unknown as { get: () => InferParamType<K> }).get()
          }
          setParams(data)
        } catch (err) {
          Logger.error('Error getting wallet connect cache', err)
        }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      if (!params) return null

      return <WrappedComponent {...(props as P)} params={params} />
    }
  }
}
