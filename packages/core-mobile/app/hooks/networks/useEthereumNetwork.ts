import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { getEthereumNetwork } from 'services/network/utils/providerUtils'
import { useMemo } from 'react'
import { Network } from '@avalabs/core-chains-sdk'
import { useNetworks } from './useNetworks'

export const useEthereumNetwork = (): Network | undefined => {
  const { allNetworks } = useNetworks()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useMemo(
    () => getEthereumNetwork(allNetworks, isDeveloperMode),
    [isDeveloperMode, allNetworks]
  )
}
