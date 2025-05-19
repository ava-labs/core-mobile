import React, { useMemo } from 'react'
import {
  useTheme,
  Text,
  View,
  GroupList,
  GroupListItem
} from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { CurrencyIcon } from 'common/components/CurrencyIcon'
import { selectSelectedAppearance } from 'store/settings/appearance'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const AppAppearance = ({
  selectAppAppearance,
  selectCurrency
}: {
  selectCurrency: () => void
  selectAppAppearance: () => void
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const currency = useSelector(selectSelectedCurrency)
  const appearance = useSelector(selectSelectedAppearance)

  const data = useMemo(() => {
    const _data: GroupListItem[] = [
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
              testID="right_value__Currency"
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
      }
    ]
    if (isDeveloperMode === false) {
      _data.push({
        title: 'Theme',
        onPress: selectAppAppearance,
        value: appearance
      })
    }
    return _data
  }, [
    selectCurrency,
    currency,
    colors.$textSecondary,
    isDeveloperMode,
    selectAppAppearance,
    appearance
  ])

  return (
    <GroupList
      data={data}
      titleSx={{ fontSize: 16, lineHeight: 22, fontFamily: 'Inter-Regular' }}
      valueSx={{ fontSize: 16, lineHeight: 22 }}
      separatorMarginRight={16}
    />
  )
}
