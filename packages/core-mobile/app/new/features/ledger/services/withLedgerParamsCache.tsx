import React, { useState, useLayoutEffect } from 'react'
import Logger from 'utils/Logger'
import { ledgerParamsCache } from './ledgerParamsCache'

type LedgerKey = keyof typeof ledgerParamsCache

type InferParamType<K extends LedgerKey> = ReturnType<
  // TODO: upgrade prettier to latest version to fix this
  // eslint-disable-next-line prettier/prettier
  (typeof ledgerParamsCache)[K]['get']
>

export function withLedgerParamsCache<K extends LedgerKey>(key: K) {
  return function <P extends { params: InferParamType<K> }>(
    WrappedComponent: React.ComponentType<P>
  ) {
    return function LedgerParamsCacheWrapper(
      props: Omit<P, 'params'>
    ): JSX.Element | null {
      const [params, setParams] = useState<InferParamType<K> | null>(null)

      useLayoutEffect(() => {
        try {
          const data = ledgerParamsCache[key].get()
          setParams(data as InferParamType<K>)
        } catch (err) {
          Logger.error('Error getting ledger params cache', err)
        }
      }, [])

      if (!params) return null

      return <WrappedComponent {...(props as P)} params={params} />
    }
  }
}
