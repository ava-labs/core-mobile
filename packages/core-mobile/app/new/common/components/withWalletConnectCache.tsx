import React, { useState, useLayoutEffect } from 'react'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import Logger from 'utils/Logger'

type WalletConnectKey = keyof typeof walletConnectCache

type InferParamType<K extends WalletConnectKey> = ReturnType<
  // TODO: upgrade prettier to latest version to fix this
  // eslint-disable-next-line prettier/prettier
  (typeof walletConnectCache)[K]['get']
>

export function withWalletConnectCache<K extends WalletConnectKey>(key: K) {
  return function <P extends { params: InferParamType<K> }>(
    WrappedComponent: React.ComponentType<P>
  ) {
    return function WalletConnectCacheWrapper(
      props: Omit<P, 'params'>
    ): JSX.Element | null {
      const [params, setParams] = useState<InferParamType<K> | null>(null)

      useLayoutEffect(() => {
        try {
          const data = walletConnectCache[key].get()
          setParams(data as InferParamType<K>)
        } catch (err) {
          Logger.error('Error getting wallet connect cache', err)
        }
      }, [])

      if (!params) return null

      return <WrappedComponent {...(props as P)} params={params} />
    }
  }
}
