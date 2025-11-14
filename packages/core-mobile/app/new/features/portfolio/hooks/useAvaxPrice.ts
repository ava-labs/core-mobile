import { useMemo } from 'react'
import { TokenType } from '@avalabs/vm-module-types'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'

/**
 * Returns the current AVAX price (in selected currency)
 *
 * - Only considers NATIVE tokens where symbol === 'AVAX'.
 * - Returns `0` if not found or not yet loaded.
 */
export function useAvaxPrice(): number {
  const activeAccount = useSelector(selectActiveAccount)
  const { data } = useAccountBalances(activeAccount, { enabled: false })

  return useMemo(() => {
    for (const balance of data) {
      const tokens = balance.tokens ?? []
      for (const token of tokens) {
        if (
          token.type === TokenType.NATIVE &&
          token.symbol?.toLowerCase() === 'avax' &&
          token.priceInCurrency
        ) {
          return token.priceInCurrency
        }
      }
    }
    return 0
  }, [data])
}
