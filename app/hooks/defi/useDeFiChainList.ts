import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import DeFiService from 'services/defi/DeFiService'
import { DeFiChain, DeFiChainCamelCase } from 'services/defi/types'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useDeFiChainList = () => {
  return useQuery({
    queryKey: [ReactQueryKeys.DEFI_CHAIN_LIST],
    queryFn: () => DeFiService.getSupportedChainList(),
    select: data => {
      const convertedData = DeFiChainCamelCase.array().parse(data)
      return convertedData.reduce(
        // eslint-disable-next-line no-sequences
        (acc, chain) => ((acc[chain.id] = chain), acc),
        {} as Record<string, DeFiChain>
      )
    }
  })
}
