import { useMemo, useState } from 'react'
import {
  LocalTokenId,
  LocalTokenWithBalance,
  refetchBalance,
  selectAllNetworkTokensAsLocal,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalance,
  TokenType
} from 'store/balance'
import { useDispatch, useSelector } from 'react-redux'
import { selectZeroBalanceWhiteList } from 'store/zeroBalance'
import BN from 'bn.js'
import { selectActiveNetwork } from 'store/network'

const bnZero = new BN(0)

export function useSearchableTokenList(hideZeroBalance = true): {
  searchText: string
  filteredTokenList: LocalTokenWithBalance[]
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
  const activeNetwork = useSelector(selectActiveNetwork)
  const allNetworkTokens = useSelector(
    selectAllNetworkTokensAsLocal(activeNetwork.chainId)
  )
  const mergedTokens = useMemo(() => {
    if (hideZeroBalance) return tokensWithBalance

    //append missing zero balance tokens from allNetworkTokens
    const tokensWithBalanceIDs: Record<LocalTokenId, boolean> = {}
    tokensWithBalance.forEach(token => {
      tokensWithBalanceIDs[token.localId] = true
    })
    const remainingNetworkTokens = allNetworkTokens.filter(
      token => !tokensWithBalanceIDs[token.localId]
    )
    return [...tokensWithBalance, ...remainingNetworkTokens]
  }, [allNetworkTokens, hideZeroBalance, tokensWithBalance])

  const tokensFilteredByZeroBal = useMemo(
    () =>
      filterByZeroBalance(mergedTokens, hideZeroBalance, zeroBalanceWhitelist),
    [mergedTokens, hideZeroBalance, zeroBalanceWhitelist]
  )

  const tokensSortedByAmount = useMemo(
    () =>
      tokensFilteredByZeroBal.slice().sort((a, b) => {
        return (b?.balanceInCurrency ?? 0) - (a?.balanceInCurrency ?? 0)
      }),
    [tokensFilteredByZeroBal]
  )

  const filteredTokenList = useMemo(
    () => filterTokensBySearchText(tokensSortedByAmount, searchText),
    [tokensSortedByAmount, searchText]
  )

  function refetch() {
    dispatch(refetchBalance())
  }

  function filterByZeroBalance(
    tokens: LocalTokenWithBalance[],
    hideZeroBal: boolean,
    zeroBalWhitelist: string[]
  ) {
    if (!hideZeroBal) return tokens

    return tokens.filter(
      token =>
        token.type === TokenType.NATIVE || // always show native tokens
        token.balance?.gt(bnZero) ||
        zeroBalWhitelist.includes(token.localId)
    )
  }

  function filterTokensBySearchText(
    tokens: LocalTokenWithBalance[],
    text: string
  ) {
    if (!text) {
      return tokens
    }
    const substring = text.toLowerCase()
    return tokens.filter(
      token =>
        (token.name && token.name.toLowerCase().includes(substring)) ||
        (token.symbol && token.symbol.toLowerCase().includes(substring))
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
