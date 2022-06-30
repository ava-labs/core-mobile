import { useMemo, useState } from 'react'
import { BN } from '@avalabs/avalanche-wallet-sdk'
import {
  refetchBalance,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalance,
  TokenType,
  TokenWithBalance
} from 'store/balance'
import { useDispatch, useSelector } from 'react-redux'
import { selectZeroBalanceWhiteList } from 'store/zeroBalance'

const bnZero = new BN(0)

export function useSearchableTokenList(hideZeroBalance = true): {
  searchText: string
  filteredTokenList: TokenWithBalance[]
  setSearchText: (value: ((prevState: string) => string) | string) => void
  isLoading: boolean
  refetch: () => void
  isRefetching: boolean
} {
  const dispatch = useDispatch()
  const [searchText, setSearchText] = useState('')
  const zeroBalanceWhitelist = useSelector(selectZeroBalanceWhiteList)
  const isLoadingBalances = useSelector(selectIsLoadingBalances)
  const isRefetchingBalances = useSelector(selectIsRefetchingBalances)
  const tokensWithBalance = useSelector(selectTokensWithBalance)

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
        return b.balanceInCurrency - a.balanceInCurrency
      }),
    [tokensFilteredByZeroBal]
  )

  const filteredTokenList =
    useMemo(
      () => filterTokensBySearchText(tokensSortedByAmount, searchText),
      [tokensFilteredByZeroBal, searchText]
    ) ?? []

  function refetch() {
    dispatch(refetchBalance())
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
    isLoading: isLoadingBalances,
    refetch,
    isRefetching: isRefetchingBalances
  }
}
