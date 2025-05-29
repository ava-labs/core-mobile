import { Network } from '@avalabs/core-chains-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { defaultEnabledL2ChainIds, selectNetworks } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export function useL2Networks(): {
  networks: Network[]
} {
  const allNetworks = useSelector(selectNetworks)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const networks = useMemo(() => {
    if (isDeveloperMode) return [] as Network[]

    const l2Networks = Object.values(allNetworks).filter(network =>
      defaultEnabledL2ChainIds.includes(network.chainId)
    )
    return l2Networks as Network[]
  }, [allNetworks, isDeveloperMode])

  return { networks }
}
