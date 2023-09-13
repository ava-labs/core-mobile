import { useQuery } from '@tanstack/react-query'
import { REACT_QUERY_KEYS } from 'consts/reactQueryKeys'
import DeFiService from 'services/defi/DeFiService'
import { DeFiChain } from 'services/defi/types'
import { convertSnakeToCamel } from 'utils/convertSnakeToCamel'

export const useDeFiChainList = () => {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.DEFI_CHAIN_LIST],
    queryFn: () => DeFiService.getSupportedChainList(),
    select: data => {
      const convertedData = convertSnakeToCamel(data) as DeFiChain[]
      return convertedData.reduce(
        // eslint-disable-next-line no-sequences
        (acc, chain) => ((acc[chain.id] = chain), acc),
        {} as Record<string, DeFiChain>
      )
    }
  })
}
