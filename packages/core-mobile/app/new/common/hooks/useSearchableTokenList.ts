import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import {
  refetchBalance,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalanceForAccount,
  selectTokensWithBalanceForAccountAndNetwork
} from 'store/balance/slice'
import { LocalTokenId, LocalTokenWithBalance } from 'store/balance/types'
import { getLocalTokenId, isTokenVisible } from 'store/balance/utils'
import { selectEnabledChainIds } from 'store/network'
import { selectTokenVisibility, TokenVisibility } from 'store/portfolio'
import { RootState } from 'store/types'

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

const isNotDisabled =
  (enabledChainIds: number[]) => (token: LocalTokenWithBalance) =>
    enabledChainIds.includes(token.networkChainId)

export function useSearchableTokenList({
  tokens,
  hideZeroBalance = true,
  hideBlacklist = true,
  hideDisabled = true,
  hideNft = true,
  chainId
}: {
  tokens?: NetworkContractToken[]
  hideZeroBalance?: boolean
  hideBlacklist?: boolean
  hideDisabled?: boolean
  hideNft?: boolean
  chainId?: number
}): {
  searchText: string
  filteredTokenList: LocalTokenWithBalance[]
  setSearchText: (value: ((prevState: string) => string) | string) => void
  isLoading: boolean
  refetch: () => void
  isRefetching: boolean
} {
  const allNetworkTokens = useMemo(() => {
    if (tokens === undefined) return []

    return (
      tokens.map(token => {
        return {
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
        } as LocalTokenWithBalance
      }) ?? []
    )
  }, [tokens])

  const dispatch = useDispatch()
  const [searchText, setSearchText] = useState('')
  const tokenVisibility = useSelector(selectTokenVisibility)
  const isLoadingBalances = useSelector(selectIsLoadingBalances)
  const isRefetchingBalances = useSelector(selectIsRefetchingBalances)
  const activeAccount = useSelector(selectActiveAccount)
  const enabledChainIds = useSelector(selectEnabledChainIds)
  const tokensWithBalance = useSelector((state: RootState) => {
    if (chainId) {
      return selectTokensWithBalanceForAccountAndNetwork(
        state,
        chainId,
        activeAccount?.id
      )
    }
    return selectTokensWithBalanceForAccount(state, activeAccount?.id)
  })

  // 1. merge tokens with balance with the remaining
  // zero balance tokens from avalanche and ethereum networks
  const mergedTokens = useMemo(() => {
    const tokensWithBalanceIDs: Record<LocalTokenId, boolean> = {}

    tokensWithBalance.forEach(token => {
      tokensWithBalanceIDs[token.localId.toLowerCase()] = true
    })

    const remainingNetworkTokens = allNetworkTokens.filter(
      token => !tokensWithBalanceIDs[token.localId.toLowerCase()]
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

    if (hideDisabled) {
      filters.push(isNotDisabled(enabledChainIds))
    }

    return filters.reduce(
      (_tokens, filter) => _tokens.filter(filter),
      mergedTokens
    )
  }, [
    hideZeroBalance,
    hideBlacklist,
    hideNft,
    searchText,
    hideDisabled,
    mergedTokens,
    tokenVisibility,
    enabledChainIds
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
