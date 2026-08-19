import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { LocalTokenWithBalance } from 'store/balance'
import { selectActiveAccount } from 'store/account'
import { selectEnabledChainIds } from 'store/network'
import { selectTokenVisibility } from 'store/portfolio'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { ServiceProviderCategories } from '../consts'
import { CryptoCurrency } from '../types'
import { useMeldToken } from '../store'
import {
  asZeroBalanceToken,
  isTokenTradable,
  meldCurrencyTokenKey,
  MeldListFilterOptions,
  passesMeldListFilters
} from '../utils'
import { useMeldContractTokenMap } from './useMeldContractTokenMap'

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
  const tokensWithBalance = useTokensWithBalanceForAccount({ account })
  const contractTokenMap = useMeldContractTokenMap()
  const includeZeroBalance =
    category === ServiceProviderCategories.CRYPTO_ONRAMP

  return useMemo(() => {
    if (meldToken === undefined) return undefined

    const filterOptions: MeldListFilterOptions = {
      includeZeroBalance,
      tokenVisibility,
      enabledChainIds
    }
    const passesListFilters = (tk: LocalTokenWithBalance): boolean =>
      passesMeldListFilters(tk, filterOptions)

    const held = tokensWithBalance.find(
      tk => passesListFilters(tk) && isTokenTradable(meldToken, tk)
    )
    if (held) {
      return { ...meldToken, tokenWithBalance: held }
    }

    if (!includeZeroBalance) return undefined

    const key = meldCurrencyTokenKey(meldToken)
    if (key === undefined) return undefined

    const contractToken = contractTokenMap.get(key)
    if (contractToken === undefined) return undefined

    const stub = asZeroBalanceToken(contractToken)
    return passesListFilters(stub) && isTokenTradable(meldToken, stub)
      ? { ...meldToken, tokenWithBalance: stub }
      : undefined
  }, [
    meldToken,
    tokensWithBalance,
    contractTokenMap,
    tokenVisibility,
    enabledChainIds,
    includeZeroBalance
  ])
}
