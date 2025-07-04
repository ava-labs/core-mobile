import React, { useMemo, useState } from 'react'
import {
  Icons,
  SCREEN_WIDTH,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { LocalTokenWithBalance } from 'store/balance'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSendSelectedToken } from 'features/send/store'
import { SelectTokenScreen } from 'common/screens/SelectTokenScreen'
import { useNetworks } from 'hooks/networks/useNetworks'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { useContacts } from 'common/hooks/useContacts'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { AddrBookItemType } from 'store/addressBook'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { sortTokensWithPrimaryFirst } from 'common/utils/sortTokensWithPrimaryFirst'
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
  const erc20ContractTokens = useErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens
  })
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
    return sortTokensWithPrimaryFirst({ tokens: searchResults })
  }, [searchResults])

  const renderItem: ListRenderItem<LocalTokenWithBalance> = ({
    item,
    index
  }): React.JSX.Element => {
    const isSelected =
      selectedToken?.localId === item.localId &&
      selectedToken.networkChainId === item.networkChainId
    const isLastItem = index === searchResults.length - 1

    const balance =
      isTokenWithBalancePVM(item) || isTokenWithBalanceAVM(item)
        ? item.availableDisplayValue
        : item.balanceDisplayValue
    return (
      <TouchableOpacity
        onPress={() => handleSelectToken(item)}
        sx={{
          marginTop: 10,
          paddingLeft: 16
        }}>
        <View
          sx={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 16
          }}>
          <View sx={{ flexDirection: 'row', gap: 10 }}>
            <LogoWithNetwork
              token={item}
              outerBorderColor={colors.$surfaceSecondary}
            />
            <View>
              <Text
                variant="buttonMedium"
                testID={`token_selector__${item.symbol}`}
                numberOfLines={1}
                sx={{ width: SCREEN_WIDTH * 0.65 }}>
                {item.name}
              </Text>
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
      keyExtractor={item => `${item.localId}-${item.networkChainId}`}
    />
  )
}
