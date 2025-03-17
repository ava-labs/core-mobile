import React from 'react'
import { useTheme, Text, Icons, View, GroupList } from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'

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
    theme: { colors, isDark }
  } = useTheme()
  const currency = useSelector(selectSelectedCurrency)

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
            <Icons.Currencies.USD width={21} height={21} />
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
      value: isDark ? 'Dark theme' : 'Light theme'
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
