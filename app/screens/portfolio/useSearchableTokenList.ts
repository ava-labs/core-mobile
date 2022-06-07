import { useEffect, useMemo, useState } from 'react'
import { BN } from '@avalabs/avalanche-wallet-sdk'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { TokenWithBalance } from 'store/balance'
import { useTokens } from 'hooks/useTokens'

type ShowZeroArrayType = { [x: string]: boolean }
const bnZero = new BN(0)

// TODO reimplement loading CP-2114
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
  const [searchText, setSearchText] = useState('')

  const tokensWithBalance = useTokens()

  const [showZeroBalanceList, setZeroBalanceList] = useState<ShowZeroArrayType>(
    {
      ['init']: false
    }
  )
  const tokensFilteredByZeroBal = useMemo(
    () =>
      filterByZeroBalance(
        tokensWithBalance,
        hideZeroBalance
        //showZeroBalanceList
      ),
    [tokensWithBalance, hideZeroBalance]
  )

  const filteredTokenList = useMemo(
    () => filterTokensBySearchText(tokensFilteredByZeroBal, searchText),
    [tokensFilteredByZeroBal, searchText]
  )

  useEffect(loadZeroBalanceList, [])

  // TODO reimplement refresh CP-2114
  function loadTokenList() {
    // if (wallet) {
    //   setLoading(true)
    //   updateAllBalances(wallet).then(() => setLoading(false))
    // }
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

  // TODO reimplement zero balance white list cp-2163
  function filterByZeroBalance(
    tokens: TokenWithBalance[],
    hideZeroBalance: boolean
    // zeroBalanceWhitelist: ShowZeroArrayType
  ) {
    if (!hideZeroBalance) return tokens

    return tokens.filter(
      token =>
        token.isNetworkToken || // always show network token
        token.balance?.gt(bnZero)
      // ||
      //   zeroBalanceWhitelist[getTokenUID(token)]
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
    loading: false
  }
}
