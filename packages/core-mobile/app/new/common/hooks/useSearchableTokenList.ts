import { TokenType } from '@avalabs/vm-module-types'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { LocalTokenWithBalance } from 'store/balance/types'
import { isTokenVisible } from 'store/balance/utils'
import { selectEnabledChainIds } from 'store/network'
import { selectTokenVisibility, TokenVisibility } from 'store/portfolio'
import { useIsLoadingBalancesForAccount } from 'features/portfolio/hooks/useIsLoadingBalancesForAccount'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { useAccountBalances } from '../../features/portfolio/hooks/useAccountBalances'

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
  hideZeroBalance = true,
  hideBlacklist = true,
  hideDisabled = true,
  hideNft = true,
  chainId
}: {
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
  const [searchText, setSearchText] = useState('')
  const tokenVisibility = useSelector(selectTokenVisibility)
  const activeAccount = useSelector(selectActiveAccount)
  const isLoadingBalances = useIsLoadingBalancesForAccount(activeAccount)
  const enabledChainIds = useSelector(selectEnabledChainIds)
  const tokensWithBalance = useTokensWithBalanceForAccount({
    account: activeAccount,
    chainId
  })
  const { refetch, isRefetching } = useAccountBalances(activeAccount)

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
      tokensWithBalance
    )
  }, [
    hideZeroBalance,
    hideBlacklist,
    hideNft,
    searchText,
    hideDisabled,
    tokensWithBalance,
    tokenVisibility,
    enabledChainIds
  ])

  const tokensSortedByAmount = useMemo(
    () =>
      tokensFiltered
        .slice()
        .sort(
          (a, b) => (b.balanceInCurrency ?? 0) - (a.balanceInCurrency ?? 0)
        ),
    [tokensFiltered]
  )

  return {
    filteredTokenList: tokensSortedByAmount,
    searchText,
    setSearchText,
    isLoading: isLoadingBalances,
    refetch,
    isRefetching
  }
}
