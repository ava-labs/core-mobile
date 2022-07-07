import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import ContentLoader, { Rect, Path } from 'react-content-loader/native'
import { Dimensions, View } from 'react-native'
import { Opacity70 } from 'resources/Constants'

const deviceWidth = Dimensions.get('screen').width
const aspectRatio = 414 / 540

export const PortfolioTokensLoader = () => {
  const { theme } = useApplicationContext()
  const backgroundColor = theme.colorBg2
  const foregroundColor = theme.colorBg3 + Opacity70

  return (
    <View
      style={{
        alignItems: 'center',
        width: deviceWidth,
        aspectRatio: aspectRatio,
        marginTop: 14,
        marginLeft: 16
      }}>
      <ContentLoader
        speed={1}
        width="100%"
        height="100%"
        viewBox="0 0 414 540"
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}>
        <Rect x="0" y="190" rx="6" ry="6" width="382" height="147" />
        <Path d="M 320 43 c 0 -5.523 4.477 -6 6 -6 h 56 v 96 h -56 c -5.523 0  -6 -4.477 -6 -6 V 43 z" />
        <Rect x="0" y="37" rx="6" ry="6" width="72" height="96" />
        <Rect x="80" y="37" rx="6" ry="6" width="72" height="96" />
        <Rect x="160" y="37" rx="6" ry="6" width="72" height="96" />
        <Rect x="240" y="37" rx="6" ry="6" width="72" height="96" />
        <Rect x="0" y="154" rx="6" ry="6" width="97" height="17" />
        <Rect x="0" y="0" rx="6" ry="6" width="97" height="17" />
        <Rect x="0" y="351" rx="6" ry="6" width="184" height="87" />
        <Rect x="0" y="453" rx="6" ry="6" width="184" height="87" />
        <Rect x="200" y="351" rx="6" ry="6" width="182" height="87" />
        <Rect x="200" y="453" rx="6" ry="6" width="182" height="87" />
      </ContentLoader>
    </View>
  )
}
