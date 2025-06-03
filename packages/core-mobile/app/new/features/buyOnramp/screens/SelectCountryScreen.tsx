import {
  TouchableOpacity,
  useTheme,
  View,
  Text,
  Icons,
  Separator,
  SearchBar,
  Image
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreen } from 'common/components/ListScreen'
import { LoadingState } from 'common/components/LoadingState'
import errorIcon from '../../../assets/icons/melting_face.png'
import { useOnRampCountryCode } from '../store'
import { Country, useSearchCountries } from '../hooks/useSearchCountries'

export const SelectCountryScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { canGoBack, back } = useRouter()
  const [searchText, setSearchText] = useState('')
  const [selectedCountryCode, setSelectedCountryCode] = useOnRampCountryCode()
  const { data: countries, isLoading } = useSearchCountries()

  const sortedCountries = useMemo(() => {
    const usCountries = countries
      ? countries.filter(country => country.countryCode.includes('US'))
      : []
    const otherCountries = countries
      ? countries.toSorted((a, b) => a.countryCode.localeCompare(b.countryCode))
      : []
    return [...usCountries, ...otherCountries]
  }, [countries])

  const searchResults = useMemo(() => {
    if (searchText === '') {
      return sortedCountries
    }
    return sortedCountries.filter(
      country =>
        country.countryCode.toLowerCase().includes(searchText.toLowerCase()) ||
        country.name.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [searchText, sortedCountries])

  const renderItem = useCallback(
    (item: Country, index: number): React.JSX.Element => {
      const { name, countryCode } = item
      const isLastItem = index === searchResults.length - 1
      const isSelected = countryCode === selectedCountryCode
      return (
        <TouchableOpacity
          sx={{ marginTop: 18 }}
          onPress={() => {
            setSelectedCountryCode(countryCode)
            canGoBack() && back()
          }}>
          <View
            sx={{
              paddingLeft: 16,
              paddingRight: 12,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 18
            }}>
            <View
              sx={{
                flexGrow: 1,
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
              </View>
              {isSelected && (
                <Icons.Navigation.Check
                  testID={`selected_country__${countryCode}`}
                  color={colors.$textPrimary}
                />
              )}
            </View>
          </View>
          {!isLastItem && (
            <View sx={{ marginLeft: 16 }}>
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
      searchResults.length,
      selectedCountryCode,
      setSelectedCountryCode
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
    if (isLoading) {
      return <LoadingState sx={{ flex: 1 }} />
    }
    return (
      <ErrorState
        sx={{ flex: 1 }}
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No country found"
        description=""
      />
    )
  }, [isLoading])

  return (
    <ListScreen
      title="Select a country"
      data={searchResults}
      isModal
      keyExtractor={(item, index): string => `${item.countryCode}-${index}`}
      renderItem={item => renderItem(item.item as Country, item.index)}
      renderEmpty={renderEmpty}
      renderHeader={renderHeader}
    />
  )
}
