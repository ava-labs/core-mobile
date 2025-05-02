import React, { useMemo } from 'react'
import { View, Text, alpha, useTheme } from '@avalabs/k2-alpine'
import { StyleSheet, ViewStyle } from 'react-native'
import { numberToSubscriptFormat } from 'utils/numberToSubscriptFormat/numberToSubscriptFormat'

interface Props {
  number: number | undefined
  testID?: string
  textColor?: string
  style?: ViewStyle
  textSize?: number | undefined
  subTextSize?: number | undefined
}

export const SubTextNumber: React.FC<Props> = ({
  number,
  testID,
  textColor,
  style,
  textSize = 16,
  subTextSize = 13
}) => {
  const {
    theme: { colors }
  } = useTheme()
  const { mainTextBefore, subText, mainTextAfter } = useMemo(
    () => numberToSubscriptFormat(number),
    [number]
  )

  const _textColor = textColor ?? alpha(colors.$textPrimary, 0.6)

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Text
        numberOfLines={1}
        style={[{ color: _textColor, fontSize: textSize }]}>
        {mainTextBefore}
      </Text>
      {subText && (
        <Text
          style={[
            styles.subTextSmall,
            { color: _textColor, fontSize: subTextSize }
          ]}>
          {subText}
        </Text>
      )}
      {mainTextAfter && (
        <Text style={[{ color: _textColor, fontSize: textSize }]}>
          {mainTextAfter}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '70%'
  },
  subTextSmall: {
    fontWeight: '500',
    position: 'relative',
    top: 4
  }
})
