import { Peer } from '@avalabs/avalanchejs/dist/info/model'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const usePeers = (): UseQueryResult<Record<string, Peer>, Error> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const provider = useAvalancheXpProvider(isDeveloperMode)

  return useQuery({
    queryKey: ['peers', provider],
    queryFn: () => {
      if (provider === undefined) {
        throw new Error('Avalanche provider is not available')
      }
      return EarnService.getPeers(provider)
    },
    select: data => {
      return data.peers.reduce(
        // eslint-disable-next-line no-sequences
        (acc, peer) => ((acc[peer.nodeID] = peer), acc),
        {} as Record<string, Peer>
      )
    }
  })
}
