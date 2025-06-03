import {
  Button,
  GroupList,
  Image,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { Space } from 'common/components/Space'
import React, { useCallback, useMemo } from 'react'
import { LoadingState } from 'common/components/LoadingState'
import { useSearchFiatCurrencies } from '../hooks/useSearchFiatCurrencies'
import { useSearchCountries } from '../hooks/useSearchCountries'

export const SelectLocale = ({
  selectedCountryCode,
  currencyCode,
  onNext,
  onSelectCountry,
  onSelectCurrency
}: {
  selectedCountryCode?: string
  currencyCode?: string
  onNext: () => void
  onSelectCountry: () => void
  onSelectCurrency: () => void
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { data: countries } = useSearchCountries()
  const { data: currencies, isLoading: isLoadingCurrencies } =
    useSearchFiatCurrencies()

  const country = countries?.find(c => c.countryCode === selectedCountryCode)

  const renderFooter = (): React.JSX.Element => {
    return (
      <Button type="primary" size="large" onPress={onNext}>
        Next
      </Button>
    )
  }

  const renderCurrencyValue = useCallback((): React.JSX.Element => {
    if (isLoadingCurrencies) {
      return <LoadingState />
    }

    const currency = currencies?.find(
      curr => curr.currencyCode === currencyCode
    )

    return (
      <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
        {currencyCode && (
          <View
            sx={{
              width: 21,
              height: 21,
              borderRadius: 21,
              overflow: 'hidden'
            }}>
            <Image
              source={{ uri: currency?.symbolImageUrl }}
              sx={{ width: 21, height: 21 }}
            />
          </View>
        )}
        <Text
          testID="right_value__Currency"
          variant="body2"
          sx={{
            color: colors.$textSecondary,
            fontSize: 16,
            lineHeight: 22,
            marginLeft: 9
          }}>
          {currencyCode?.toUpperCase()}
        </Text>
      </View>
    )
  }, [colors.$textSecondary, currencies, currencyCode, isLoadingCurrencies])

  const groupListData = useMemo(() => {
    return [
      {
        title: 'Country',
        onPress: onSelectCountry,
        value: (
          <Text
            variant="body2"
            sx={{
              color: colors.$textSecondary,
              fontSize: 16,
              lineHeight: 22,
              marginLeft: 9
            }}>
            {country?.name}
          </Text>
        )
      },
      {
        title: 'Currency',
        onPress: onSelectCurrency,
        value: renderCurrencyValue()
      }
    ]
  }, [
    colors.$textSecondary,
    country?.name,
    onSelectCountry,
    onSelectCurrency,
    renderCurrencyValue
  ])

  return (
    <ScrollScreen
      title={`Before starting,\nare these correct?`}
      navigationTitle="Are these correct?"
      isModal
      scrollEnabled={false}
      renderFooter={renderFooter}
      contentContainerStyle={{
        padding: 16
      }}>
      <Space y={16} />
      <GroupList
        data={groupListData}
        titleSx={{
          fontSize: 15,
          lineHeight: 18,
          fontFamily: 'Inter-Medium'
        }}
        separatorMarginRight={16}
        subtitleSx={{ fontSize: 13, lineHeight: 18 }}
        valueSx={{
          fontSize: 16,
          lineHeight: 22
        }}
      />
    </ScrollScreen>
  )
}
