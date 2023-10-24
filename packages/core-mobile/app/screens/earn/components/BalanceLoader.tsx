import React from 'react'
import ContentLoader, { Rect, Circle } from 'react-content-loader/native'
import { Dimensions, StyleSheet, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 343 / 171

export const BalanceLoader = () => {
  const { backgroundColor, foregroundColor } = useSkeletonColors()

  return (
    <View style={styles.container}>
      <ContentLoader
        speed={1}
        width={'100%'}
        height={'100%'}
        viewBox="0 0 343 171"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Circle cx="64" cy="46" r="40" />
        <Rect x="0" y="123" rx="24" ry="24" width="343" height="48" />
        <Rect x="128" y="0" rx="8" ry="8" width="190" height="25" />
        <Rect x="128" y="33" rx="8" ry="8" width="190" height="25" />
        <Rect x="128" y="66" rx="8" ry="8" width="190" height="25" />
      </ContentLoader>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: deviceWidth - 32,
    aspectRatio: aspectRatio,
    marginTop: 18,
    marginBottom: 19
  }
})
