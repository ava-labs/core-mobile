import { useEffect, useMemo, useState } from 'react'
import { BN } from '@avalabs/avalanche-wallet-sdk'
import { useWalletContext } from '@avalabs/wallet-react-components'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { ChainId } from '@avalabs/chains-sdk'
import { selectTokensWithBalance, TokenWithBalance } from 'store/balance'

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
  const network = useSelector(selectActiveNetwork)
  const wallet = useWalletContext().wallet
  const addressC = wallet?.getAddressC() ?? ''
  const addressBtc = wallet?.getAddressBTC('bitcoin') ?? ''

  let addressToFetch

  if (network.chainId === ChainId.BITCOIN) {
    addressToFetch = addressBtc
  } else {
    addressToFetch = addressC
  }
  // TODO reimplement loading
  // const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  const tokensWithBalance = useSelector(
    selectTokensWithBalance(network.chainId, addressToFetch)
  )

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

  // TODO reimplement refresh
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

  // TODO reimplement zero balance white list
  function filterByZeroBalance(
    tokens: TokenWithBalance[],
    hideZeroBalance: boolean
    // zeroBalanceWhitelist: ShowZeroArrayType
  ) {
    if (!hideZeroBalance) return tokens

    return tokens.filter(
      token =>
        'coingeckoId' in token || // this is a network token -> always show it
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
