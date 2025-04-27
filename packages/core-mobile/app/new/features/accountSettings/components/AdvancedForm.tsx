import { useTheme, View } from '@avalabs/k2-alpine'
import React, { useCallback } from 'react'
import { AdvancedField, AdvancedFieldProps } from './AdvancedField'

export const AdvancedForm = ({
  data
}: {
  data: AdvancedFieldProps[]
}): React.JSX.Element => {
  const { theme } = useTheme()

  const renderField = useCallback(
    (item: AdvancedFieldProps, index: number): React.JSX.Element => {
      return (
        <View key={item.id}>
          <AdvancedField {...item} />

          {index !== data.length - 1 && (
            <View
              sx={{
                height: 1,
                backgroundColor: theme.colors.$borderPrimary,
                marginHorizontal: 16
              }}
            />
          )}
        </View>
      )
    },
    [data, theme.colors.$borderPrimary]
  )
  return (
    <View
      sx={{
        backgroundColor: '$surfaceSecondary',
        width: '100%',
        borderRadius: 12
      }}>
      {data.map(renderField)}
    </View>
  )
}
