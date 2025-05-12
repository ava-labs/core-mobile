import React, { useMemo } from 'react'
import { View, Text, alpha, useTheme } from '@avalabs/k2-alpine'
import { StyleSheet } from 'react-native'
import { numberToSubscriptFormat } from 'utils/numberToSubscriptFormat/numberToSubscriptFormat'

interface Props {
  number: number | undefined
  testID?: string
  size?: 'big' | 'small'
}

export const SubTextNumber: React.FC<Props> = ({
  number,
  testID,
  size = 'small'
}) => {
  const {
    theme: { colors }
  } = useTheme()
  const { mainTextBefore, subText, mainTextAfter } = useMemo(
    () => numberToSubscriptFormat(number),
    [number]
  )

  const textVariant = size === 'big' ? 'heading5' : 'body1'
  const textSize = size === 'big' ? 26 : 16
  const textColor = alpha(colors.$textPrimary, 0.6)

  return (
    <View style={styles.container} testID={testID}>
      <Text
        numberOfLines={1}
        variant={textVariant}
        sx={{ color: textColor, fontSize: textSize }}>
        {mainTextBefore}
      </Text>
      {subText && (
        <Text
          style={size === 'big' ? styles.subTextBig : styles.subTextSmall}
          variant={textVariant}
          sx={{ color: textColor }}>
          {subText}
        </Text>
      )}
      {mainTextAfter && (
        <Text
          variant={textVariant}
          sx={{ color: textColor, fontSize: textSize }}>
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
    fontSize: 13,
    fontWeight: '500',
    position: 'relative',
    top: 4
  },
  subTextBig: {
    fontSize: 15,
    position: 'relative',
    top: 4
  }
})
