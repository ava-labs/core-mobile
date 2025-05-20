import { LocalTokenWithBalance } from 'store/balance/types'
import { useAvalancheErc20ContractTokens } from './useErc20ContractTokens'
import { useSearchableTokenList } from './useSearchableTokenList'

export const useSwapList = (): LocalTokenWithBalance[] => {
  const avalancheErc20ContractTokens = useAvalancheErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: avalancheErc20ContractTokens,
    hideZeroBalance: false
  })

  return filteredTokenList
}
