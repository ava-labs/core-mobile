import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'
import { ChainId } from '@avalabs/core-chains-sdk'
import { tokenAddresses } from 'consts/tokenIds'
import { LocalTokenWithBalance } from 'store/balance'
import { isTokenVisible } from 'store/balance/utils'
import { selectActiveAccount } from 'store/account'
import { selectEnabledChainIds } from 'store/network'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsSolanaSupportBlocked } from 'store/posthog/slice'
import { getLocalTokenId } from 'services/balance/utils/getLocalTokenId'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useSolanaTokens } from 'common/hooks/useSolanaTokens'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { ServiceProviderCategories } from '../consts'
import { CryptoCurrency } from '../types'
import { useMeldToken } from '../store'
import { isTokenTradable } from '../utils'

export const asZeroBalanceToken = (
  token: NetworkContractToken
): LocalTokenWithBalance =>
  ({
    ...token,
    ...('chainId' in token && { networkChainId: token.chainId }),
    localId: getLocalTokenId(token),
    balance: 0n,
    balanceInCurrency: 0,
    balanceDisplayValue: '0',
    balanceCurrencyDisplayValue: '0',
    priceInCurrency: 0,
    marketCap: 0,
    change24: 0,
    vol24: 0
  } as LocalTokenWithBalance)

/**
 * Resolves the selected meld token to a token with balance. Deliberately does
 * NOT use useSearchableTokenList: that pipeline rebuilds/filters/sorts the
 * full ~57k contract-token list on every balance update, which is far too
 * heavy for resolving a single already-selected token (CP buy-flow lag).
 */
export const useMeldTokenWithBalance = ({
  category
}: {
  category: ServiceProviderCategories
}):
  | (CryptoCurrency & { tokenWithBalance: LocalTokenWithBalance })
  | undefined => {
  const [meldToken] = useMeldToken()
  const account = useSelector(selectActiveAccount)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const enabledChainIds = useSelector(selectEnabledChainIds)
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)
  const tokensWithBalance = useTokensWithBalanceForAccount({ account })
  const erc20ContractTokens = useErc20ContractTokens()
  const solanaTokens = useSolanaTokens()
  const includeZeroBalance =
    category === ServiceProviderCategories.CRYPTO_ONRAMP

  return useMemo(() => {
    if (meldToken === undefined) return undefined

    const passesListFilters = (tk: LocalTokenWithBalance): boolean =>
      (includeZeroBalance || tk.balance > 0n) &&
      isTokenVisible(tokenVisibility, tk) &&
      tk.type !== TokenType.ERC1155 &&
      tk.type !== TokenType.ERC721 &&
      enabledChainIds.includes(tk.networkChainId)

    const held = tokensWithBalance.find(
      tk => passesListFilters(tk) && isTokenTradable(meldToken, tk)
    )
    if (held) {
      return { ...meldToken, tokenWithBalance: held }
    }

    if (!includeZeroBalance) return undefined

    // Solana stubs are deliberately restricted to USDC_SOLANA — widening SPL
    // support is a product decision, not a perf fix.
    const usdcSolanaTokens = isSolanaSupportBlocked
      ? []
      : solanaTokens.filter(
          tk =>
            'chainId' in tk &&
            tk.chainId === ChainId.SOLANA_MAINNET_ID &&
            tk.address === tokenAddresses.USDC_SOLANA
        )

    // Cheap prefilter covering every isTokenTradable arm (address match for
    // erc20/SPL, symbol match for BTC/SOL) so we only build stubs for a
    // handful of candidates instead of all ~57k.
    const meldAddress = meldToken.contractAddress?.toLowerCase()
    const candidates = [...erc20ContractTokens, ...usdcSolanaTokens].filter(
      tk =>
        (meldAddress !== undefined &&
          tk.address.toLowerCase() === meldAddress) ||
        tk.symbol === 'BTC' ||
        tk.symbol === 'SOL'
    )

    for (const candidate of candidates) {
      const stub = asZeroBalanceToken(candidate)
      if (passesListFilters(stub) && isTokenTradable(meldToken, stub)) {
        return { ...meldToken, tokenWithBalance: stub }
      }
    }

    return undefined
  }, [
    meldToken,
    tokensWithBalance,
    erc20ContractTokens,
    solanaTokens,
    isSolanaSupportBlocked,
    tokenVisibility,
    enabledChainIds,
    includeZeroBalance
  ])
}
