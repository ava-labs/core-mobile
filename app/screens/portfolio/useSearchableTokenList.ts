import { useEffect, useMemo, useState } from 'react'
import { BN } from '@avalabs/avalanche-wallet-sdk'
import {
  TokenWithBalance,
  updateAllBalances,
  useNetworkContext,
  useWalletContext,
  useWalletStateContext
} from '@avalabs/wallet-react-components'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getTokenUID } from 'utils/TokenTools'
import { useApplicationContext } from 'contexts/ApplicationContext'

type ShowZeroArrayType = { [x: string]: boolean }
const bnZero = new BN(0)

export function useSearchableTokenList(hideZeroBalance = true): {
  searchText: string
  setShowZeroBalanceList: (list: ShowZeroArrayType) => void
  loadZeroBalanceList: () => void
  filteredTokenList?: TokenWithBalance[]
  showZeroBalanceList: ShowZeroArrayType
  setSearchText: (value: ((prevState: string) => string) | string) => void
  loadTokenList: () => void
  loading: boolean
} {
  const walletState = useWalletStateContext()
  const wallet = useWalletContext().wallet
  const network = useNetworkContext()?.network
  const { loadTokensCache, saveTokensCache } =
    useApplicationContext().repo.portfolioTokensCache
  const [loading, setLoading] = useState(false)
  const [tokenMap, setTokenMap] = useState(new Map<string, TokenWithBalance>())
  const [searchText, setSearchText] = useState('')
  const sortedTokens = useMemo(
    () => sortTokenList(Array.from(tokenMap.values())),
    [tokenMap]
  )
  const [showZeroBalanceList, setZeroBalanceList] = useState<ShowZeroArrayType>(
    {
      ['init']: false
    }
  )
  const tokensFilteredByZeroBal = useMemo(
    () =>
      filterByZeroBalance(sortedTokens, hideZeroBalance, showZeroBalanceList),
    [sortedTokens, hideZeroBalance, showZeroBalanceList]
  )
  const filteredTokenList = useMemo(
    () => filterTokensBySearchText(tokensFilteredByZeroBal, searchText),
    [tokensFilteredByZeroBal, searchText]
  )
  const [isLoadingCache, setIsLoadingCache] = useState(true)

  useEffect(loadZeroBalanceList, [])
  useEffect(initTokensFromCache, [network])
  useEffect(setAvaxToken, [walletState?.avaxToken, isLoadingCache])
  useEffect(setErc20Tokens, [walletState?.erc20Tokens, isLoadingCache])
  useEffect(cacheTokens, [network, tokenMap, isLoadingCache])

  function cacheTokens() {
    if (network && !isLoadingCache) {
      saveTokensCache(network.name, tokenMap)
    }
  }

  function initTokensFromCache() {
    if (!network) {
      return
    }
    loadTokensCache(network.name).then(value => {
      setTokenMap(new Map(value))
      setIsLoadingCache(false)
    })
    setIsLoadingCache(false)
  }

  function sortTokenList(tokens: TokenWithBalance[]) {
    tokens.sort((a, b) => {
      if (a.isAvax && b.isAvax) {
        return 0
      } else if (a.isAvax) {
        return -1
      } else {
        return 1
      }
    })
    return tokens
  }

  function setAvaxToken() {
    if (!walletState || isLoadingCache) {
      return
    }
    const avaxUid = getTokenUID(walletState.avaxToken)
    if (avaxUid === '0') {
      return //sometimes walletState.avaxToken is empty object
    }
    setTokenMap(prevState => {
      prevState.set(avaxUid, walletState.avaxToken)
      return new Map(prevState)
    })
  }

  function setErc20Tokens() {
    if (!walletState || isLoadingCache) {
      return
    }
    setTokenMap(prevState => {
      const avaxId = getTokenUID(walletState.avaxToken)
      const avax = prevState.get(avaxId) //leave avax if there, replace others
      prevState.clear()
      if (avax) {
        prevState.set(avaxId, avax)
      }
      walletState.erc20Tokens?.forEach(value => {
        const tokenUID = getTokenUID(value)
        prevState.set(tokenUID, value)
      })
      return new Map(prevState)
    })
  }

  function loadTokenList() {
    if (wallet) {
      setLoading(true)
      updateAllBalances(wallet).then(() => setLoading(false))
    }
  }

  function loadZeroBalanceList() {
    AsyncStorage.getItem('showZeroBalanceList.v2').then(value => {
      if (value) {
        const list: ShowZeroArrayType = JSON.parse(value)
        setZeroBalanceList({ ...list })
      }
    })
  }

  const setShowZeroBalanceList = (list: ShowZeroArrayType) => {
    AsyncStorage.setItem('showZeroBalanceList.v2', JSON.stringify(list)).then(
      () => setZeroBalanceList(list)
    )
  }

  function filterByZeroBalance(
    tokens: TokenWithBalance[],
    hideZeroBalance: boolean,
    zeroBalanceWhitelist: ShowZeroArrayType
  ) {
    return tokens.filter(
      token =>
        token.isAvax ||
        !hideZeroBalance ||
        (hideZeroBalance &&
          (token.balance?.gt(bnZero) ||
            zeroBalanceWhitelist[getTokenUID(token)]))
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
    setShowZeroBalanceList,
    showZeroBalanceList,
    loadZeroBalanceList,
    loadTokenList,
    loading
  }
}
