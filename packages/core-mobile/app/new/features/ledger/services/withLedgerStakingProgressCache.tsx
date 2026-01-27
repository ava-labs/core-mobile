import React, { useState, useLayoutEffect } from 'react'
import Logger from 'utils/Logger'
import {
  ledgerStakingProgressCache,
  LedgerStakingProgressParams
} from './ledgerStakingProgressCache'

export function withLedgerStakingProgressCache<
  P extends { params: LedgerStakingProgressParams }
>(WrappedComponent: React.ComponentType<P>) {
  return function LedgerStakingProgressCacheWrapper(
    props: Omit<P, 'params'>
  ): JSX.Element | null {
    const [params, setParams] = useState<LedgerStakingProgressParams | null>(
      null
    )

    useLayoutEffect(() => {
      try {
        const data = ledgerStakingProgressCache.params.get()
        setParams(data)
      } catch (err) {
        Logger.error('Error getting ledger staking progress cache', err)
      }
    }, [])

    if (!params) return null

    return <WrappedComponent {...(props as P)} params={params} />
  }
}

