import {
  Icons,
  Image,
  SearchBar,
  Separator,
  Text,
  TouchableOpacity,
  View,
  useTheme
} from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreen } from 'common/components/ListScreen'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { CurrencySymbol } from 'store/settings/currency'
import errorIcon from '../../../assets/icons/melting_face.png'

type Currency = {
  name: string
  symbol: string
  logoUrl: string | React.ReactNode
}

export const SelectCurrency = ({
  currencies,
  selectedCurrency,
  setSelectedCurrency
}: {
  currencies: Currency[]
  selectedCurrency?: string
  setSelectedCurrency: (currency: CurrencySymbol) => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { canGoBack, back } = useRouter()
  const [searchText, setSearchText] = useState('')

  const searchResults = useMemo(() => {
    if (searchText === '') {
      return currencies
    }
    return currencies.filter(
      currency =>
        currency.name.toLowerCase().includes(searchText.toLowerCase()) ||
        currency.symbol.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [currencies, searchText])

  const renderLogo = useCallback((logoUrl: string | React.ReactNode) => {
    if (typeof logoUrl === 'string') {
      return <Image source={{ uri: logoUrl }} sx={{ width: 36, height: 36 }} />
    }
    return logoUrl
  }, [])

  const renderItem = useCallback(
    (item: Currency, index: number): React.JSX.Element => {
      const { name, symbol, logoUrl } = item
      const isLastItem = index === searchResults.length - 1
      const isSelected = symbol === selectedCurrency
      return (
        <TouchableOpacity
          sx={{ marginTop: 12 }}
          onPress={() => {
            setSelectedCurrency(symbol as CurrencySymbol)
            canGoBack() && back()
          }}>
          <View
            sx={{
              paddingLeft: 16,
              paddingRight: 12,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12
            }}>
            <View
              sx={{
                width: 36,
                height: 36,
                borderRadius: 18,
                overflow: 'hidden'
              }}>
              {renderLogo(logoUrl)}
            </View>
            <View
              sx={{
                flexGrow: 1,
                marginHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
              <View
                sx={{
                  flexShrink: 1
                }}>
                <Text variant="buttonMedium" numberOfLines={1} sx={{ flex: 1 }}>
                  {name}
                </Text>
                <Text
                  testID={`currency__${symbol}`}
                  variant="body2"
                  sx={{ lineHeight: 16, flex: 1 }}
                  ellipsizeMode="tail"
                  numberOfLines={1}>
                  {symbol}
                </Text>
              </View>
              {isSelected && (
                <Icons.Navigation.Check
                  testID={`selected_currency__${symbol}`}
                  color={colors.$textPrimary}
                />
              )}
            </View>
          </View>
          {!isLastItem && (
            <View sx={{ marginLeft: 62 }}>
              <Separator />
            </View>
          )}
        </TouchableOpacity>
      )
    },
    [
      back,
      canGoBack,
      colors.$textPrimary,
      renderLogo,
      searchResults.length,
      selectedCurrency,
      setSelectedCurrency
    ]
  )

  const renderHeader = useCallback(() => {
    return (
      <SearchBar
        onTextChanged={setSearchText}
        searchText={searchText}
        placeholder="Search"
        useDebounce={true}
      />
    )
  }, [setSearchText, searchText])

  const renderEmpty = useCallback(() => {
    return (
      <ErrorState
        sx={{ flex: 1 }}
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No currency found"
        description=""
      />
    )
  }, [])

  return (
    <ListScreen
      title="Select a currency"
      data={searchResults}
      isModal
      keyExtractor={(item): string => (item as Currency).symbol}
      renderItem={item => renderItem(item.item as Currency, item.index)}
      renderEmpty={renderEmpty}
      renderHeader={renderHeader}
    />
  )
}
