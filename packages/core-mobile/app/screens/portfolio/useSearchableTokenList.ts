import { useMemo, useState } from 'react'
import {
  LocalTokenId,
  LocalTokenWithBalance,
  refetchBalance,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalance
} from 'store/balance'
import { useDispatch, useSelector } from 'react-redux'
import { selectTokenBlacklist } from 'store/portfolio'
import BN from 'bn.js'
import { useNetworks } from 'hooks/useNetworks'

const bnZero = new BN(0)

const isGreaterThanZero = (token: LocalTokenWithBalance): boolean =>
  token.balance?.gt(bnZero)

const isNotBlacklisted =
  (tokenBlacklist: string[]) => (token: LocalTokenWithBalance) =>
    !tokenBlacklist.includes(token.localId)

const containSearchText = (text: string) => (token: LocalTokenWithBalance) => {
  const substring = text.toLowerCase()

  return (
    token.name.toLowerCase().includes(substring) ||
    token.symbol.toLowerCase().includes(substring)
  )
}

export function useSearchableTokenList(
  hideZeroBalance = true,
  hideBlacklist = true
): {
  searchText: string
  filteredTokenList: LocalTokenWithBalance[]
  setSearchText: (value: ((prevState: string) => string) | string) => void
  isLoading: boolean
  refetch: () => void
  isRefetching: boolean
} {
  const { allNetworkTokensAsLocal: allNetworkTokens, activeNetwork } =
    useNetworks()
  const dispatch = useDispatch()
  const [searchText, setSearchText] = useState('')
  const tokenBlacklist = useSelector(selectTokenBlacklist)
  const isLoadingBalances = useSelector(selectIsLoadingBalances)
  const isRefetchingBalances = useSelector(selectIsRefetchingBalances)
  const tokensWithBalance = useSelector(
    selectTokensWithBalance(activeNetwork.chainId)
  )

  // 1. merge tokens with balance with the remaining
  // zero balance tokens from the active network
  const mergedTokens = useMemo(() => {
    const tokensWithBalanceIDs: Record<LocalTokenId, boolean> = {}
    tokensWithBalance.forEach(token => {
      tokensWithBalanceIDs[token.localId] = true
    })
    const remainingNetworkTokens = allNetworkTokens.filter(
      token => !tokensWithBalanceIDs[token.localId]
    )
    return [...tokensWithBalance, ...remainingNetworkTokens]
  }, [allNetworkTokens, tokensWithBalance])

  // 2. filter tokens by balance, blacklist and search text
  const tokensFiltered = useMemo(() => {
    const filters: Array<(token: LocalTokenWithBalance) => boolean> = []

    if (hideZeroBalance) {
      filters.push(isGreaterThanZero)
    }

    if (hideBlacklist) {
      filters.push(isNotBlacklisted(tokenBlacklist))
    }

    if (searchText.length > 0) {
      filters.push(containSearchText(searchText))
    }

    return filters.reduce(
      (tokens, filter) => tokens.filter(filter),
      mergedTokens
    )
  }, [hideZeroBalance, hideBlacklist, searchText, mergedTokens, tokenBlacklist])

  // 3. sort tokens by amount
  const tokensSortedByAmount = useMemo(
    () =>
      tokensFiltered
        .slice()
        .sort((a, b) => b.balanceInCurrency - a.balanceInCurrency),
    [tokensFiltered]
  )

  const refetch = (): void => {
    dispatch(refetchBalance())
  }

  return {
    filteredTokenList: tokensSortedByAmount,
    searchText,
    setSearchText,
    isLoading: isLoadingBalances,
    refetch,
    isRefetching: isRefetchingBalances
  }
}
