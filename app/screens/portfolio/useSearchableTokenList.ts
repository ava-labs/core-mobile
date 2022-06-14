import { useMemo, useState } from 'react'
import { BN } from '@avalabs/avalanche-wallet-sdk'
import { TokenType, TokenWithBalance } from 'store/balance'
import { useTokens } from 'hooks/useTokens'
import { useSelector } from 'react-redux'
import { selectZeroBalanceWhiteList } from 'store/settings/zeroBalance'

const bnZero = new BN(0)

// TODO reimplement loading CP-2114
export function useSearchableTokenList(hideZeroBalance = true): {
  searchText: string
  filteredTokenList?: TokenWithBalance[]
  setSearchText: (value: ((prevState: string) => string) | string) => void
  loadTokenList: () => void
  loading: boolean
} {
  const [searchText, setSearchText] = useState('')

  const zeroBalanceWhitelist = useSelector(selectZeroBalanceWhiteList)

  const tokensWithBalance = useTokens()

  const tokensFilteredByZeroBal = useMemo(
    () =>
      filterByZeroBalance(
        tokensWithBalance,
        hideZeroBalance,
        zeroBalanceWhitelist
      ),
    [tokensWithBalance, hideZeroBalance, zeroBalanceWhitelist]
  )

  const tokensSortedByAmount = useMemo(
    () =>
      tokensFilteredByZeroBal.slice().sort((a, b) => {
        return b.balanceUSD - a.balanceUSD
      }),
    [tokensFilteredByZeroBal]
  )

  const filteredTokenList = useMemo(
    () => filterTokensBySearchText(tokensSortedByAmount, searchText),
    [tokensFilteredByZeroBal, searchText]
  )

  // TODO reimplement refresh CP-2114
  function loadTokenList() {
    // if (wallet) {
    //   setLoading(true)
    //   updateAllBalances(wallet).then(() => setLoading(false))
    // }
  }

  function filterByZeroBalance(
    tokens: TokenWithBalance[],
    hideZeroBalance: boolean,
    zeroBalanceWhitelist: string[]
  ) {
    if (!hideZeroBalance) return tokens

    return tokens.filter(
      token =>
        token.type === TokenType.NATIVE || // always show native tokens
        token.balance?.gt(bnZero) ||
        zeroBalanceWhitelist.includes(token.id)
    )
  }

  function filterTokensBySearchText(tokens: TokenWithBalance[], text: string) {
    const regExp = new RegExp(text, 'i')
    return tokens.filter(
      token =>
        (token.name && token.name.search(regExp) !== -1) ||
        (token.symbol && token.symbol.search(regExp) !== -1)
    )
  }

  return {
    filteredTokenList,
    searchText,
    setSearchText,
    loadTokenList,
    loading: false
  }
}
