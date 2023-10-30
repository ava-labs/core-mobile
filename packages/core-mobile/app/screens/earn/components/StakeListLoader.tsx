import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, StyleSheet, View } from 'react-native'
import { useSkeletonColors } from 'hooks/colors/useSkeletonColors'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 343 / 390

export const StakeListLoader = () => {
  const { backgroundColor, foregroundColor } = useSkeletonColors()

  return (
    <View style={styles.container}>
      <ContentLoader
        speed={1}
        width={'100%'}
        height={'100%'}
        viewBox="0 0 343 390"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Rect x="0" y="205" rx="8" ry="8" width="343" height="189" />
        <Rect x="0" y="0" rx="8" ry="8" width="343" height="189" />
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
