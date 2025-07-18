import React, { useMemo } from 'react'
import { SelectSwapTokenScreen } from 'features/swap/screens/SelectSwapTokenScreen'
import { useSwapSelectedFromToken } from 'features/swap/store'
import { useAvalancheErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useSolanaTokens } from 'common/hooks/useSolanaTokens'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import useSolanaNetwork from 'hooks/earn/useSolanaNetwork'
import { useSelector } from 'react-redux'
import { selectIsSolanaSwapBlocked } from 'store/posthog'

const SelectSwapFromTokenScreen = (): JSX.Element => {
  const [selectedFromToken, setSelectedFromToken] = useSwapSelectedFromToken()
  const cChainNetwork = useCChainNetwork()
  const solanaNetwork = useSolanaNetwork()
  const isSolanaSwapBlocked = useSelector(selectIsSolanaSwapBlocked)
  const avalancheErc20ContractTokens = useAvalancheErc20ContractTokens()
  const solanaTokens = useSolanaTokens()
  const { filteredTokenList: filteredCChainTokens } = useSearchableTokenList({
    tokens: avalancheErc20ContractTokens,
    chainId: cChainNetwork?.chainId,
    hideZeroBalance: true
  })
  const { filteredTokenList: filteredSolanaTokens } = useSearchableTokenList({
    tokens: solanaTokens,
    chainId: solanaNetwork?.chainId,
    hideZeroBalance: true
  })
  const filteredTokenList = useMemo(() => {
    const tokens = [...filteredCChainTokens]
    if (!isSolanaSwapBlocked) {
      tokens.push(...filteredSolanaTokens)
    }
    return tokens.sort(
      (a, b) => (b.balanceInCurrency ?? 0) - (a.balanceInCurrency ?? 0)
    )
  }, [isSolanaSwapBlocked, filteredCChainTokens, filteredSolanaTokens])

  return (
    <SelectSwapTokenScreen
      tokens={filteredTokenList}
      selectedToken={selectedFromToken}
      setSelectedToken={setSelectedFromToken}
    />
  )
}

export default SelectSwapFromTokenScreen
