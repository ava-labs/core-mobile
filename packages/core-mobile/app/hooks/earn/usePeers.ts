import { info } from '@avalabs/avalanchejs'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const usePeers = (): UseQueryResult<
  Record<string, info.Peer>,
  Error
> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    queryKey: ['peers', isDeveloperMode],
    queryFn: async () => {
      const provider = await NetworkService.getAvalancheProviderXP(
        isDeveloperMode
      )
      // Call the provider method directly to avoid type conflicts
      return provider.getInfo().peers()
    },
    select: data => {
      return data.peers.reduce(
        // eslint-disable-next-line no-sequences
        (acc, peer) => ((acc[peer.nodeID] = peer), acc),
        {} as Record<string, info.Peer>
      )
    }
  })
}
