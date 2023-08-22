import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const useNodes = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    queryKey: ['nodes', isDeveloperMode],
    queryFn: async () => {
      const validatorsData = await EarnService.getCurrentValidators(
        isDeveloperMode
      )
      const nodeIds = validatorsData.validators.map(
        validator => validator.nodeID
      )
      const peersData = await EarnService.getPeers(nodeIds, isDeveloperMode)
      return { validators: validatorsData.validators, peers: peersData.peers }
    },
    select: ({ validators, peers }) => {
      const nodesWithVersion = validators.map(validator => {
        const peer = peers.find(p => {
          return p.nodeID === validator.nodeID
        })
        return {
          ...validator,
          version: peer?.version
        }
      })
      return nodesWithVersion
    }
  })
}
