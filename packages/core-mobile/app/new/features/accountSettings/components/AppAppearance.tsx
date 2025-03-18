import React from 'react'
import { useTheme, Text, View, GroupList } from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { CurrencyIcon } from 'common/components/CurrencyIcon'
import { selectSelectedAppearance } from 'store/settings/appearance'

export const AppAppearance = ({
  selectAppAppearance,
  selectAppIcon,
  selectCurrency
}: {
  selectCurrency: () => void
  selectAppAppearance: () => void
  selectAppIcon: () => void
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const currency = useSelector(selectSelectedCurrency)
  const appearance = useSelector(selectSelectedAppearance)

  const data = [
    {
      title: 'Currency',
      onPress: selectCurrency,
      value: (
        <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            sx={{
              width: 21,
              height: 21,
              borderRadius: 21,
              overflow: 'hidden'
            }}>
            <CurrencyIcon symbol={currency} size={21} />
          </View>
          <Text
            variant="body2"
            sx={{
              color: colors.$textSecondary,
              fontSize: 16,
              lineHeight: 22,
              marginLeft: 9
            }}>
            {currency.toUpperCase()}
          </Text>
        </View>
      )
    },
    {
      title: 'Appearance',
      onPress: selectAppAppearance,
      value: appearance
    },
    {
      title: 'App icon',
      onPress: selectAppIcon,
      value: 'Default'
    }
  ]

  return (
    <GroupList
      data={data}
      titleSx={{ fontSize: 16, lineHeight: 22, fontFamily: 'Inter-Regular' }}
      valueSx={{ fontSize: 16, lineHeight: 22 }}
      separatorMarginRight={16}
    />
  )
}
