import { useQuery } from '@tanstack/react-query'
import DeFiService from 'services/defi/DeFiService'
import { DeFiProtocol } from 'services/defi/types'
import { convertSnakeToCamel } from 'utils/convertSnakeToCamel'

export const useDeFiProtocol = (userAddress: string, protocolId: string) => {
  return useQuery({
    queryKey: ['deFiProtocol', userAddress, protocolId],
    queryFn: () => DeFiService.getDeFiProtocol(userAddress, protocolId),
    select: data => convertSnakeToCamel(data) as DeFiProtocol
  })
}
