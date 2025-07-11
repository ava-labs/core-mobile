import { Text, TextVariant, View, alpha, useTheme } from '@avalabs/k2-alpine'
import React, { useMemo } from 'react'
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
        style={[{ color: _textColor, fontWeight: subTextStyle.fontWeight }]}>
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
        <Text
          variant={textVariant}
          style={[{ color: _textColor, fontWeight: subTextStyle.fontWeight }]}>
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

type SubTextNumberVariant = Extract<
  TextVariant,
  'body1' | 'body2' | 'heading2' | 'caption' | 'subtitle2' | 'buttonMedium'
>

const getSubTextStyle = (textVariant: SubTextNumberVariant): TextStyle => {
  let style: TextStyle = {
    position: 'relative'
  }
  if (textVariant === 'subtitle2') {
    style = { ...style, fontSize: 11, top: 4, fontWeight: '500' }
  }
  if (textVariant === 'caption') {
    style = { ...style, fontSize: 9, top: 4, fontWeight: '500' }
  }
  if (textVariant === 'body1') {
    style = { ...style, fontSize: 13, top: 4, fontWeight: '500' }
  }
  if (textVariant === 'body2') {
    style = { ...style, fontSize: 13, top: 4, fontWeight: '400' }
  }
  if (textVariant === 'heading2') {
    style = { ...style, fontSize: 18, top: 8, fontWeight: '700' }
  }
  if (textVariant === 'buttonMedium') {
    style = { ...style, fontSize: 15, top: 6, fontWeight: '600' }
  }

  return style
}
