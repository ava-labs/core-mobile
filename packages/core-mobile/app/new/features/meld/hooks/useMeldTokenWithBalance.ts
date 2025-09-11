import { useMemo } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { useSearchableERC20AndSolanaTokenList } from 'common/hooks/useSearchableERC20AndSolanaTokenList'
import { ServiceProviderCategories } from '../consts'
import { CryptoCurrency } from '../types'
import { useMeldToken } from '../store'
import { isTokenTradable } from '../utils'

export const useMeldTokenWithBalance = ({
  category
}: {
  category: ServiceProviderCategories
}):
  | (CryptoCurrency & { tokenWithBalance: LocalTokenWithBalance })
  | undefined => {
  const [meldToken] = useMeldToken()
  const { filteredErc20TokenList, filteredSolanaTokenList } =
    useSearchableERC20AndSolanaTokenList(
      category !== ServiceProviderCategories.CRYPTO_ONRAMP
    )

  return useMemo(() => {
    const t = [...filteredErc20TokenList, ...filteredSolanaTokenList].find(
      tk => meldToken && isTokenTradable(meldToken, tk)
    )
    if (t) {
      return {
        ...meldToken,
        tokenWithBalance: t
      }
    }
  }, [filteredErc20TokenList, filteredSolanaTokenList, meldToken])
}
