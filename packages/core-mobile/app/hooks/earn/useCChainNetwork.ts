import { Network } from '@avalabs/core-chains-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { getAvalancheNetwork } from 'services/network/utils/providerUtils'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const useCChainNetwork = (): Network | undefined => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { networks } = useNetworks()

  return useMemo(
    () => getAvalancheNetwork(networks, isDeveloperMode),
    [isDeveloperMode, networks]
  )
}

export default useCChainNetwork
