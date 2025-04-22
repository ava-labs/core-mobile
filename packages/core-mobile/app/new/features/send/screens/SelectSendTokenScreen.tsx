import React, { useMemo, useState } from 'react'
import {
  Icons,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { AVAX_P_ID, AVAX_X_ID, LocalTokenWithBalance } from 'store/balance'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSendSelectedToken } from 'features/send/store'
import { SelectTokenScreen } from 'common/screens/SelectTokenScreen'
import { useNetworks } from 'hooks/networks/useNetworks'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { useContacts } from 'common/hooks/useContacts'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { TokenType } from '@avalabs/vm-module-types'
import { AddrBookItemType } from 'store/addressBook'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { getNetworks } from '../utils/getNetworks'

export const SelectSendTokenScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { to, recipientType } = useLocalSearchParams<{
    to: string
    recipientType: AddrBookItemType | 'address'
  }>()
  const { back, canGoBack } = useRouter()
  const { allNetworks } = useNetworks()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const [searchText, setSearchText] = useState<string>('')
  const { contacts, accounts } = useContacts()
  const [selectedToken, setSelectedToken] = useSendSelectedToken()
  const { filteredTokenList } = useSearchableTokenList({})
  const handleSelectToken = (token: LocalTokenWithBalance): void => {
    setSelectedToken(token)
    canGoBack() && back()
  }

  const tokens = useMemo(() => {
    const networks = getNetworks({
      to,
      recipientType,
      allNetworks,
      isDeveloperMode,
      contacts: contacts.concat(accounts)
    })
    return filteredTokenList.filter(t =>
      networks.some(network => network.chainId === t.networkChainId)
    )
  }, [
    accounts,
    allNetworks,
    contacts,
    filteredTokenList,
    isDeveloperMode,
    recipientType,
    to
  ])

  const searchResults = useMemo(() => {
    if (searchText.length === 0) {
      return tokens
    }
    return tokens.filter(
      token =>
        token.name.toLowerCase().includes(searchText.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchText.toLowerCase()) ||
        token.networkChainId.toString().includes(searchText)
    )
  }, [tokens, searchText])

  const sortedSearchResults = useMemo(() => {
    const sortedAvalancheTokens: LocalTokenWithBalance[] = []
    const cChainToken = tokens.find(
      token =>
        token.type === TokenType.NATIVE && token.localId === 'AvalancheAVAX'
    )
    if (cChainToken) {
      sortedAvalancheTokens.push(cChainToken)
    }
    const pChainToken = tokens.find(
      token => token.type === TokenType.NATIVE && token.localId === AVAX_P_ID
    )
    if (pChainToken) {
      sortedAvalancheTokens.push(pChainToken)
    }
    const xChainToken = tokens.find(
      token => token.type === TokenType.NATIVE && token.localId === AVAX_X_ID
    )
    if (xChainToken) {
      sortedAvalancheTokens.push(xChainToken)
    }
    const rest = tokens.filter(
      token =>
        token.localId !== 'AvalancheAVAX' &&
        token.localId !== AVAX_P_ID &&
        token.localId !== AVAX_X_ID
    )
    const sorted = rest.sort(
      (a, b) => Number(b.balanceInCurrency) - Number(a.balanceInCurrency)
    )
    return [...sortedAvalancheTokens, ...sorted]
  }, [tokens])

  const renderItem: ListRenderItem<LocalTokenWithBalance> = ({
    item,
    index
  }): React.JSX.Element => {
    const isSelected = selectedToken?.localId === item.localId
    const isLastItem = index === searchResults.length - 1

    const balance =
      isTokenWithBalancePVM(item) || isTokenWithBalanceAVM(item)
        ? item.availableDisplayValue
        : item.balanceDisplayValue
    return (
      <TouchableOpacity
        onPress={() => handleSelectToken(item)}
        sx={{
          marginTop: 10
        }}>
        <View
          sx={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <View sx={{ flexDirection: 'row', gap: 10 }}>
            <LogoWithNetwork
              token={item}
              outerBorderColor={colors.$surfaceSecondary}
            />
            <View>
              <Text variant="buttonMedium">{item.name}</Text>
              <Text variant="subtitle2">{balance + ' ' + item.symbol}</Text>
            </View>
          </View>
          {isSelected && (
            <Icons.Custom.CheckSmall color={colors.$textPrimary} />
          )}
        </View>
        {!isLastItem && (
          <Separator
            sx={{
              marginTop: 10,
              marginLeft: 46,
              width: '100%'
            }}
          />
        )}
      </TouchableOpacity>
    )
  }

  return (
    <SelectTokenScreen
      onSearchText={setSearchText}
      searchText={searchText}
      tokens={sortedSearchResults ?? []}
      renderListItem={renderItem}
      keyExtractor={item => item.localId}
    />
  )
}
