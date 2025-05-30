import React, { useMemo } from 'react'
import { View, Text, alpha, useTheme, TextVariant } from '@avalabs/k2-alpine'
import { StyleSheet, TextStyle, ViewStyle } from 'react-native'
import { numberToSubscriptFormat } from 'utils/numberToSubscriptFormat/numberToSubscriptFormat'

export const SubTextNumber = ({
  number,
  testID,
  textColor,
  style,
  textVariant = 'body1'
}: {
  number: number | undefined
  testID?: string
  textColor?: string
  style?: ViewStyle
  textVariant?: SubTextNumberVariant
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { mainTextBefore, subText, mainTextAfter } = useMemo(
    () => numberToSubscriptFormat(number),
    [number]
  )
  const subTextStyle = useMemo(
    () => getSubTextStyle(textVariant),
    [textVariant]
  )

  const _textColor = textColor ?? alpha(colors.$textPrimary, 0.6)

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Text
        numberOfLines={1}
        variant={textVariant}
        style={[{ color: _textColor }]}>
        {mainTextBefore}
      </Text>
      {subText && (
        <Text
          variant={textVariant}
          style={[subTextStyle, { color: _textColor }]}>
          {subText}
        </Text>
      )}
      {mainTextAfter && (
        <Text variant={textVariant} style={[{ color: _textColor }]}>
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
    maxWidth: '80%'
  }
})

type SubTextNumberVariant = Extract<TextVariant, 'body1' | 'body2' | 'heading2'>

const getSubTextStyle = (textVariant: SubTextNumberVariant): TextStyle => {
  let style: TextStyle = {
    position: 'relative'
  }
  if (textVariant === 'body1') {
    style = { ...style, fontSize: 13, top: 4, fontWeight: '500' }
  }
  if (textVariant === 'body2') {
    style = { ...style, fontSize: 13, top: 4, fontWeight: '400' }
  }
  if (textVariant === 'heading2') {
    style = { ...style, fontSize: 18, top: 10, fontWeight: '700' }
  }

  return style
}
