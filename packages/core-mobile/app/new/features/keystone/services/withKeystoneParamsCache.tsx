import React, { useState, useLayoutEffect } from 'react'
import Logger from 'utils/Logger'
import { keystoneParamsCache } from './keystoneParamsCache'

type KeystoneKey = keyof typeof keystoneParamsCache

type InferParamType<K extends KeystoneKey> = ReturnType<
  // TODO: upgrade prettier to latest version to fix this
  // eslint-disable-next-line prettier/prettier
  (typeof keystoneParamsCache)[K]['get']
>

export function withKeystoneParamsCache<K extends KeystoneKey>(key: K) {
  return function <P extends { params: InferParamType<K> }>(
    WrappedComponent: React.ComponentType<P>
  ) {
    return function KeystoneParamsCacheWrapper(
      props: Omit<P, 'params'>
    ): JSX.Element | null {
      const [params, setParams] = useState<InferParamType<K> | null>(null)

      useLayoutEffect(() => {
        try {
          const data = keystoneParamsCache[key].get()
          setParams(data as InferParamType<K>)
        } catch (err) {
          Logger.error('Error getting keystone params cache', err)
        }
      }, [])

      if (!params) return null

      return <WrappedComponent {...(props as P)} params={params} />
    }
  }
}
