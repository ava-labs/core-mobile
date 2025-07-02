import { useMemo } from 'react'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { LocalTokenWithBalance } from 'store/balance'
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
  const erc20ContractTokens = useErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens,
    hideZeroBalance: category !== ServiceProviderCategories.CRYPTO_ONRAMP
  })

  return useMemo(() => {
    const t = filteredTokenList.find(
      tk => meldToken && isTokenTradable(meldToken, tk)
    )
    if (t) {
      return {
        ...meldToken,
        tokenWithBalance: t
      }
    }
  }, [filteredTokenList, meldToken])
}
