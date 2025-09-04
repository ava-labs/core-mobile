import { Button, GroupList, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { Space } from 'common/components/Space'
import React, { useCallback, useMemo } from 'react'
import { LoadingState } from 'common/components/LoadingState'
import { CurrencyIcon } from 'common/components/CurrencyIcon'
import { CurrencySymbol } from 'store/settings/currency'
import { FiatCurrency, Country } from '../types'

export const SelectLocale = ({
  isLoadingCountry,
  isLoadingCurrency,
  selectedCountry,
  selectedCurrency,
  onNext,
  onSelectCountry,
  onSelectCurrency
}: {
  isLoadingCountry: boolean
  isLoadingCurrency: boolean
  selectedCountry?: Country
  selectedCurrency?: FiatCurrency
  onNext: () => void
  onSelectCountry: () => void
  onSelectCurrency: () => void
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const renderFooter = (): React.JSX.Element => {
    return (
      <Button
        type="primary"
        size="large"
        onPress={onNext}
        disabled={
          selectedCountry === undefined || selectedCurrency === undefined
        }>
        Next
      </Button>
    )
  }

  const renderCountryValue = useCallback((): React.JSX.Element => {
    if (isLoadingCountry) {
      return <LoadingState />
    }

    return (
      <Text
        variant="body2"
        numberOfLines={1}
        sx={{
          maxWidth: '80%',
          color: colors.$textSecondary,
          fontSize: 16,
          lineHeight: 22,
          marginLeft: 9
        }}>
        {selectedCountry?.name}
      </Text>
    )
  }, [colors.$textSecondary, selectedCountry, isLoadingCountry])

  const renderCurrencyValue = useCallback((): React.JSX.Element => {
    if (isLoadingCurrency) {
      return <LoadingState />
    }

    return (
      <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
        {selectedCurrency && (
          <View
            sx={{
              width: 21,
              height: 21,
              borderRadius: 21,
              overflow: 'hidden'
            }}>
            {selectedCurrency.currencyCode && (
              <CurrencyIcon
                size={21}
                symbol={
                  selectedCurrency.currencyCode.toUpperCase() as CurrencySymbol
                }
              />
            )}
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
          {selectedCurrency?.currencyCode?.toUpperCase()}
        </Text>
      </View>
    )
  }, [colors.$textSecondary, selectedCurrency, isLoadingCurrency])

  const groupListData = useMemo(() => {
    return [
      {
        title: 'Country',
        onPress: onSelectCountry,
        value: renderCountryValue()
      },
      {
        title: 'Currency',
        onPress: onSelectCurrency,
        value: renderCurrencyValue()
      }
    ]
  }, [
    onSelectCountry,
    onSelectCurrency,
    renderCurrencyValue,
    renderCountryValue
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
