import { useMemo, useState } from 'react'
import {
  refetchBalance,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalance
} from 'store/balance/slice'
import { LocalTokenId, LocalTokenWithBalance } from 'store/balance/types'
import { useDispatch, useSelector } from 'react-redux'
import { selectTokenVisibility, TokenVisibility } from 'store/portfolio'
import { useNetworkContractTokens } from 'hooks/networks/useNetworkContractTokens'
import { useNetworks } from 'hooks/networks/useNetworks'
import { getLocalTokenId, isTokenVisible } from 'store/balance/utils'
import { TokenType } from '@avalabs/vm-module-types'

const isGreaterThanZero = (token: LocalTokenWithBalance): boolean =>
  token.balance > 0n

const isNotBlacklisted =
  (tokenVisibility: TokenVisibility) => (token: LocalTokenWithBalance) =>
    isTokenVisible(tokenVisibility, token)

const isNotNFT = (token: LocalTokenWithBalance): boolean =>
  token.type !== TokenType.ERC1155 && token.type !== TokenType.ERC721

const containSearchText = (text: string) => (token: LocalTokenWithBalance) => {
  const substring = text.toLowerCase()

  return (
    token.name.toLowerCase().includes(substring) ||
    token.symbol.toLowerCase().includes(substring)
  )
}

export function useSearchableTokenList(
  hideZeroBalance = true,
  hideBlacklist = true,
  hideNft = true
): {
  searchText: string
  filteredTokenList: LocalTokenWithBalance[]
  setSearchText: (value: ((prevState: string) => string) | string) => void
  isLoading: boolean
  refetch: () => void
  isRefetching: boolean
} {
  const { activeNetwork } = useNetworks()
  const activeNetworkContractTokens = useNetworkContractTokens(activeNetwork)
  const allNetworkTokens = useMemo(() => {
    return (
      activeNetworkContractTokens.map(token => {
        return {
          ...token,
          localId: getLocalTokenId(token),
          balance: 0n,
          balanceInCurrency: 0,
          balanceDisplayValue: '0',
          balanceCurrencyDisplayValue: '0',
          priceInCurrency: 0,
          marketCap: 0,
          change24: 0,
          vol24: 0
        } as LocalTokenWithBalance
      }) ?? []
    )
  }, [activeNetworkContractTokens])
  const dispatch = useDispatch()
  const [searchText, setSearchText] = useState('')
  const tokenVisibility = useSelector(selectTokenVisibility)
  const isLoadingBalances = useSelector(selectIsLoadingBalances)
  const isRefetchingBalances = useSelector(selectIsRefetchingBalances)
  const tokensWithBalance = useSelector(selectTokensWithBalance)

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
      filters.push(isNotBlacklisted(tokenVisibility))
    }

    if (hideNft) {
      filters.push(isNotNFT)
    }

    if (searchText.length > 0) {
      filters.push(containSearchText(searchText))
    }

    return filters.reduce(
      (tokens, filter) => tokens.filter(filter),
      mergedTokens
    )
  }, [
    hideZeroBalance,
    hideBlacklist,
    hideNft,
    searchText,
    mergedTokens,
    tokenVisibility
  ])

  // 3. sort tokens by amount
  const tokensSortedByAmount = useMemo(
    () =>
      tokensFiltered
        .slice()
        .sort(
          (a, b) => (b.balanceInCurrency ?? 0) - (a.balanceInCurrency ?? 0)
        ),
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
