import React, { useMemo, useState } from 'react'
import {
  Icons,
  SearchBar,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import {
  useAvailableTokens,
  useSelectedToken,
  useSetSelectedToken
} from 'common/hooks/useSendStore'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { LocalTokenWithBalance } from 'store/balance'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const SelectTokenScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { back, canGoBack } = useRouter()
  const [searchText, setSearchText] = useState<string>('')
  const availableTokens = useAvailableTokens()
  const setSelectedToken = useSetSelectedToken()
  const selectedToken = useSelectedToken()
  const insets = useSafeAreaInsets()

  const handleSelectToken = (token: LocalTokenWithBalance): void => {
    setSelectedToken(token)
    canGoBack() && back()
  }

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

  const renderHeader = (): React.JSX.Element => {
    return (
      <View sx={{ gap: 8, marginBottom: 16 }}>
        <Text variant="heading2">Select a token</Text>
        <SearchBar onTextChanged={setSearchText} searchText={searchText} />
      </View>
    )
  }

  return (
    <FlashList
      ListHeaderComponent={renderHeader()}
      data={searchResults}
      estimatedItemSize={60}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 60,
        paddingHorizontal: 16
      }}
      showsVerticalScrollIndicator={false}
      renderItem={renderItem}
      keyExtractor={item => item.localId}
    />
  )
}
