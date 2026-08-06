import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'
import { useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { LocalTokenWithBalance } from 'store/balance/types'
import { isTokenVisible } from 'store/balance/utils'
import { selectEnabledChainIds } from 'store/network'
import { selectTokenVisibility, TokenVisibility } from 'store/portfolio'
import { getLocalTokenId } from 'services/balance/utils/getLocalTokenId'
// CP-14918 TEMP PROBE
import { perfCount, perfTime } from 'utils/performance/perfProbe'
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

// eslint-disable-next-line sonarjs/cognitive-complexity -- CP-14918 TEMP PROBE (perfTime wrappers) inflates complexity; strip with the probe
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
  // CP-14918 TEMP PROBE: n = hook invocations (renders), ms = summed token count
  perfCount('hook.call', tokens?.length ?? -1)

  // CP-14918 TEMP PROBE: does the `tokens` dep keep identity between renders?
  const prevTokensRef = useRef(tokens)
  perfCount(prevTokensRef.current === tokens ? 'tokens.same' : 'tokens.NEW', 0)
  prevTokensRef.current = tokens

  const allNetworkTokens = useMemo(() => {
    if (tokens === undefined) return []

    // Zero-balance contract tokens exist only to pad the list for callers that
    // want tokens the account doesn't hold (token pickers, search). Every token
    // built below gets `balance: 0n`, so when `hideZeroBalance` is set the very
    // first filter (`isGreaterThanZero`) throws all of them away again — the
    // merge, filter and sort are provably wasted work.
    //
    // Skipping it here is output-identical and removes a ~56k-token map plus the
    // filter/sort passes over that merged list from every hideZeroBalance caller
    // (Portfolio header, Assets list, Activity, Send). See CP-14918.
    if (hideZeroBalance) return []

    // CP-14918 TEMP PROBE
    perfCount('pipeline.mapSize', tokens.length)
    return perfTime(
      'pipeline.map',
      () =>
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
  }, [tokens, hideZeroBalance])

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

  // 1. merge tokens with balance with the remaining
  // zero balance tokens from avalanche and ethereum networks
  const mergedTokens = useMemo(() => {
    const tokensWithBalanceIDs: Record<string, boolean> = {}

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

    // CP-14918 TEMP PROBE
    return perfTime('pipeline.filter', () =>
      filters.reduce((_tokens, filter) => _tokens.filter(filter), mergedTokens)
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
      // CP-14918 TEMP PROBE
      perfTime('pipeline.sort', () =>
        tokensFiltered
          .slice()
          .sort(
            (a, b) => (b.balanceInCurrency ?? 0) - (a.balanceInCurrency ?? 0)
          )
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
