import React, { useMemo } from 'react'
import { View, Text } from '@avalabs/k2-mobile'
import { StyleSheet } from 'react-native'
import { numberToSubscriptFormat } from 'utils/numberToSubscriptFormat/numberToSubscriptFormat'

interface Props {
  number: number | undefined
  testID?: string
}

export const SubTextNumber: React.FC<Props> = ({ number, testID }) => {
  const { mainTextBefore, subText, mainTextAfter } = useMemo(
    () => numberToSubscriptFormat(number),
    [number]
  )

  return (
    <View style={styles.container} testID={testID}>
      <Text variant="subtitle2" sx={{ color: '$neutral50' }}>
        {mainTextBefore}
      </Text>
      {subText && (
        <Text
          style={styles.subText}
          variant="subtitle2"
          sx={{ color: '$neutral50' }}>
          {subText}
        </Text>
      )}
      {mainTextAfter && (
        <Text variant="subtitle2" sx={{ color: '$neutral50' }}>
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
  subText: {
    fontSize: 10,
    fontWeight: 'bold',
    position: 'relative',
    top: 4
  }
})
