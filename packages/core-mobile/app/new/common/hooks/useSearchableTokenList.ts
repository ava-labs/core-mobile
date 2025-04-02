import { useMemo, useState } from 'react'
import {
  refetchBalance,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalanceForAccount
} from 'store/balance/slice'
import { LocalTokenId, LocalTokenWithBalance } from 'store/balance/types'
import { useDispatch, useSelector } from 'react-redux'
import { selectTokenVisibility, TokenVisibility } from 'store/portfolio'
import { getLocalTokenId, isTokenVisible } from 'store/balance/utils'
import { TokenType } from '@avalabs/vm-module-types'
import { isErc20 } from 'common/utils/isErc20'
import { selectActiveAccount } from 'store/account'
import { RootState } from 'store'
import { useEthereumContractTokens } from './useEthereumContractTokens'
import { useCChainContractTokens } from './useCChainContractTokens'

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

export function useSearchableTokenList({
  hideZeroBalance = true,
  hideBlacklist = true,
  hideNft = true
}: {
  hideZeroBalance?: boolean
  hideBlacklist?: boolean
  hideNft?: boolean
}): {
  searchText: string
  filteredTokenList: LocalTokenWithBalance[]
  setSearchText: (value: ((prevState: string) => string) | string) => void
  isLoading: boolean
  refetch: () => void
  isRefetching: boolean
} {
  const avalancheContractTokens = useCChainContractTokens()
  const ethereumContractTokens = useEthereumContractTokens()

  const avalancheErc20ContractTokens = avalancheContractTokens.filter(token =>
    isErc20(token)
  )
  const ethereumErc20ContractTokens = ethereumContractTokens.filter(token =>
    isErc20(token)
  )

  const allNetworkTokens = useMemo(() => {
    return (
      [...avalancheErc20ContractTokens, ...ethereumErc20ContractTokens].map(
        token => {
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
        }
      ) ?? []
    )
  }, [ethereumErc20ContractTokens, avalancheErc20ContractTokens])
  const dispatch = useDispatch()
  const [searchText, setSearchText] = useState('')
  const tokenVisibility = useSelector(selectTokenVisibility)
  const isLoadingBalances = useSelector(selectIsLoadingBalances)
  const isRefetchingBalances = useSelector(selectIsRefetchingBalances)
  const activeAccount = useSelector(selectActiveAccount)
  const tokensWithBalance = useSelector((state: RootState) =>
    selectTokensWithBalanceForAccount(state, activeAccount?.index)
  )

  // 1. merge tokens with balance with the remaining
  // zero balance tokens from avalanche and ethereum networks
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
