import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { NodeValidator } from 'types/earn'

export const usePeers = (validators: NodeValidator[]) => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const nodeIds = validators.map(validator => validator.nodeID)

  return useQuery({
    enabled: !!nodeIds.length,
    queryKey: ['peers', isDeveloperMode, nodeIds],
    queryFn: async () => {
      return await EarnService.getPeers(nodeIds, isDeveloperMode)
    }
  })
}
