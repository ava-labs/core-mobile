import { tokenAddresses } from 'consts/tokenIds'
import { ChainId } from '@avalabs/core-chains-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import type { SPLToken } from '@avalabs/vm-module-types'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectIsSolanaSupportBlocked } from 'store/posthog/slice'
import { LocalTokenWithBalance } from 'store/balance/types'
import { getSolanaCaip2ChainId } from 'utils/caip2ChainIds'
import { useErc20ContractTokens } from './useErc20ContractTokens'
import { useSearchableTokenList } from './useSearchableTokenList'
import { tokenLookupKey, useTokenLookup } from './useTokenLookup'

const SOLANA_CAIP2_ID = getSolanaCaip2ChainId(ChainId.SOLANA_MAINNET_ID)
const USDC_SOLANA_LOOKUP_IDS = [
  { caip2Id: SOLANA_CAIP2_ID, address: tokenAddresses.USDC_SOLANA }
]

const usdcSolanaLookupKey = tokenLookupKey(
  SOLANA_CAIP2_ID,
  tokenAddresses.USDC_SOLANA
)

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
  const { data: usdcSolanaLookupTokens } = useTokenLookup(
    USDC_SOLANA_LOOKUP_IDS
  )

  const usdcSolanaToken = useMemo((): SPLToken | undefined => {
    const info = usdcSolanaLookupTokens[usdcSolanaLookupKey]
    if (!info) return undefined
    return {
      address: tokenAddresses.USDC_SOLANA,
      name: info.name,
      symbol: info.symbol,
      contractType: TokenType.SPL,
      type: TokenType.SPL,
      caip2Id: SOLANA_CAIP2_ID,
      // 6 is USDC's canonical decimals, used only if the lookup entry omits meta.decimals
      decimals: info.meta?.decimals?.[SOLANA_CAIP2_ID] ?? 6,
      chainId: ChainId.SOLANA_MAINNET_ID,
      logoUri: info.meta?.logoUri ?? undefined
    }
  }, [usdcSolanaLookupTokens])

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
        'address' in tk &&
        tk.address === tokenAddresses.USDC_SOLANA &&
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
