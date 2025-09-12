import { USDC_SOLANA_TOKEN_ID } from 'common/consts/swap'
import { ChainId } from '@avalabs/core-chains-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectIsSolanaSupportBlocked } from 'store/posthog/slice'
import { LocalTokenWithBalance } from 'store/balance'
import { useSolanaTokens } from './useSolanaTokens'
import { useErc20ContractTokens } from './useErc20ContractTokens'
import { useSearchableTokenList } from './useSearchableTokenList'

// TODO: we are only interested in USDC_SOLANA for now
// we should pass ERC20 tokens and SOLANA tokens to a single useSearchableTokenList when we want to support all SPL tokens
export const useSearchableERC20AndSolanaTokenList = (
  hideZeroBalance = true
): {
  filteredErc20TokenList: LocalTokenWithBalance[]
  filteredSolanaTokenList: LocalTokenWithBalance[]
} => {
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)
  const erc20ContractTokens = useErc20ContractTokens()
  const solanaTokens = useSolanaTokens()

  const usdcSolanaToken = useMemo(() => {
    return solanaTokens.find(
      tk =>
        'chainId' in tk &&
        tk.chainId === ChainId.SOLANA_MAINNET_ID &&
        tk.address === USDC_SOLANA_TOKEN_ID
    )
  }, [solanaTokens])

  const { filteredTokenList: filteredErc20TokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens,
    hideZeroBalance
  })

  const { filteredTokenList: filteredUsdcSolanaTokenList } =
    useSearchableTokenList({
      tokens:
        usdcSolanaToken && !isSolanaSupportBlocked ? [usdcSolanaToken] : [],
      hideZeroBalance
    })

  const filteredUsdcSolanaToken = useMemo(() => {
    return filteredUsdcSolanaTokenList.find(
      tk =>
        // @ts-expect-error: there is no chainId for SPL tokens
        tk.address === USDC_SOLANA_TOKEN_ID &&
        tk.networkChainId === ChainId.SOLANA_MAINNET_ID
    )
  }, [filteredUsdcSolanaTokenList])

  return {
    filteredErc20TokenList,
    filteredSolanaTokenList: filteredUsdcSolanaToken
      ? [filteredUsdcSolanaToken]
      : []
  }
}
