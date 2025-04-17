import { NetworkWithCaip2ChainId } from 'store/network'

import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { MAIN_NETWORKS, TEST_NETWORKS } from 'services/network/consts'

export function usePrimaryNetworks(): {
  networks: NetworkWithCaip2ChainId[]
} {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const networks = useMemo(() => {
    if (isDeveloperMode) return TEST_NETWORKS
    return MAIN_NETWORKS
  }, [isDeveloperMode])

  return { networks }
}
