import { LocalTokenWithBalance } from 'store/balance/types'
import useSolanaNetwork from 'hooks/earn/useSolanaNetwork'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useSelector } from 'react-redux'
import { selectIsSolanaSwapBlocked } from 'store/posthog'
import { useAvalancheErc20ContractTokens } from './useErc20ContractTokens'
import { useSearchableTokenList } from './useSearchableTokenList'
import { useSolanaTokens } from './useSolanaTokens'

export const useSwapList = (): LocalTokenWithBalance[] => {
  const cChainNetwork = useCChainNetwork()
  const isSolanaSwapBlocked = useSelector(selectIsSolanaSwapBlocked)
  const solanaNetwork = useSolanaNetwork()
  const avalancheErc20ContractTokens = useAvalancheErc20ContractTokens()
  const solanaTokens = useSolanaTokens()
  const { filteredTokenList: filteredCChainTokens } = useSearchableTokenList({
    tokens: avalancheErc20ContractTokens,
    hideZeroBalance: false,
    chainId: cChainNetwork?.chainId
  })
  const { filteredTokenList: filteredSolanaTokens } = useSearchableTokenList({
    tokens: solanaTokens,
    hideZeroBalance: false,
    chainId: solanaNetwork?.chainId
  })

  return [
    ...filteredCChainTokens,
    ...(isSolanaSwapBlocked ? [] : filteredSolanaTokens)
  ]
}
