import { useQuery } from '@tanstack/react-query'
import DeFiService from 'services/defi/DeFiService'
import { DeFiSimpleProtocol } from 'services/defi/types'
import { convertSnakeToCamel } from 'utils/convertSnakeToCamel'

export const useDeFiProtocolList = (userAddress: string) => {
  return useQuery({
    queryKey: ['deFiSimpleProtocols', userAddress],
    queryFn: () => DeFiService.getDeFiProtocolList(userAddress),
    select: data => convertSnakeToCamel(data) as DeFiSimpleProtocol[]
  })
}
