import React, { useMemo } from 'react'
import { View, Text } from '@avalabs/k2-mobile'
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
  const { mainTextBefore, subText, mainTextAfter } = useMemo(
    () => numberToSubscriptFormat(number),
    [number]
  )

  const textVariant = size === 'big' ? 'heading5' : 'subtitle2'
  return (
    <View style={styles.container} testID={testID}>
      <Text variant={textVariant} sx={{ color: '$neutral50' }}>
        {mainTextBefore}
      </Text>
      {subText && (
        <Text
          style={size === 'big' ? styles.subTextBig : styles.subTextSmall}
          variant={textVariant}
          sx={{ color: '$neutral50' }}>
          {subText}
        </Text>
      )}
      {mainTextAfter && (
        <Text variant={textVariant} sx={{ color: '$neutral50' }}>
          {mainTextAfter}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  subTextSmall: {
    fontSize: 10,
    fontWeight: 'bold',
    position: 'relative',
    top: 4
  },
  subTextBig: {
    fontSize: 15,
    fontWeight: 'bold',
    position: 'relative',
    top: 4
  }
})
