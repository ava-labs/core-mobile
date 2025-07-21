import { Network } from '@avalabs/core-chains-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { getSolanaNetwork } from 'services/network/utils/providerUtils'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const useSolanaNetwork = (): Network | undefined => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { networks } = useNetworks()

  return useMemo(
    () => getSolanaNetwork(networks, isDeveloperMode),
    [isDeveloperMode, networks]
  )
}

export default useSolanaNetwork
