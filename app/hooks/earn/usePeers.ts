import { Peer } from '@avalabs/avalanchejs-v2/dist/src/info/model'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const usePeers = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    queryKey: ['peers', isDeveloperMode],
    queryFn: () => EarnService.getPeers(isDeveloperMode),
    select: data => {
      return data.peers.reduce(
        // eslint-disable-next-line no-sequences
        (acc, peer) => ((acc[peer.nodeID] = peer), acc),
        {} as Record<string, Peer>
      )
    }
  })
}
