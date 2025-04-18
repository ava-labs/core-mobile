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
import { LocalTokenWithBalance } from 'store/balance'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { useRouter } from 'expo-router'
import { useSendSelectedToken } from 'features/send/store'
import { SelectTokenScreen } from 'common/screens/SelectTokenScreen'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'

export const SelectSendTokenScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { back, canGoBack } = useRouter()
  const [searchText, setSearchText] = useState<string>('')
  const [selectedToken, setSelectedToken] = useSendSelectedToken()
  const { filteredTokenList } = useSearchableTokenList({})
  const handleSelectToken = (token: LocalTokenWithBalance): void => {
    setSelectedToken(token)
    canGoBack() && back()
  }

  const availableTokens = useMemo(() => {
    return filteredTokenList.filter(
      token => token.networkChainId !== selectedToken?.networkChainId
    )
  }, [filteredTokenList, selectedToken?.networkChainId])

  const searchResults = useMemo(() => {
    if (searchText.length === 0) {
      return availableTokens
    }
    return availableTokens.filter(
      token =>
        token.name.toLowerCase().includes(searchText.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [availableTokens, searchText])

  const renderItem: ListRenderItem<LocalTokenWithBalance> = ({
    item,
    index
  }): React.JSX.Element => {
    const isSelected = selectedToken?.localId === item.localId
    const isLastItem = index === searchResults.length - 1
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
              <Text variant="subtitle2">
                {item.balanceDisplayValue + item.symbol}
              </Text>
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
      tokens={[]}
      renderListItem={renderItem}
      keyExtractor={item => item.localId}
    />
  )
}
