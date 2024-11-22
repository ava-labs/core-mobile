import { Peer } from '@avalabs/avalanchejs/dist/info/model'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import NetworkService from 'services/network/NetworkService'
import { selectActiveNetwork } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isDevnet } from 'utils/isDevnet'

export const usePeers = (): UseQueryResult<Record<string, Peer>, Error> => {
  const network = useSelector(selectActiveNetwork)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const devnet = isDevnet(network)

  return useQuery({
    queryKey: ['peers', isDeveloperMode, devnet],
    queryFn: async () => {
      const provider = await NetworkService.getAvalancheProviderXP(
        isDeveloperMode,
        devnet
      )
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
