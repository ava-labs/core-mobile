import { Peer } from '@avalabs/avalanchejs/dist/info/model'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectActiveNetwork } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isDevnet } from 'utils/isDevnet'

export const usePeers = (): UseQueryResult<Record<string, Peer>, Error> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeNetwork = useSelector(selectActiveNetwork)

  return useQuery({
    queryKey: ['peers', isDeveloperMode, activeNetwork],
    queryFn: () =>
      EarnService.getPeers(isDeveloperMode, isDevnet(activeNetwork)),
    select: data => {
      return data.peers.reduce(
        // eslint-disable-next-line no-sequences
        (acc, peer) => ((acc[peer.nodeID] = peer), acc),
        {} as Record<string, Peer>
      )
    }
  })
}
