import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { Opacity70 } from 'resources/Constants'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 278 / 52

export const PortfolioHeaderLoader = () => {
  const { theme } = useApplicationContext()
  const backgroundColor = theme.colorBg2
  const foregroundColor = theme.colorBg3 + Opacity70

  return (
    <View
      style={{
        width: deviceWidth * 0.65,
        aspectRatio: aspectRatio
      }}>
      <ContentLoader
        speed={1}
        width="100%"
        height="100%"
        viewBox="0 0 251 47"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Rect x="0" y="0" rx="6" ry="6" width="251" height="47" />
      </ContentLoader>
    </View>
  )
}
