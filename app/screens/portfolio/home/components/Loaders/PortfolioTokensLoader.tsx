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
        <Rect x="0" y="190" rx="8" ry="8" width="381" height="147" />
        <Rect x="0" y="37" rx="10" ry="10" width="73" height="96" />
        <Rect x="160" y="37" rx="10" ry="10" width="73" height="96" />
        <Rect x="241" y="37" rx="10" ry="10" width="72" height="96" />
        <Path d="M 320.448 46.897 c 0 -5.523 4.477 -10 10 -10 h 52.897 v 96 h -52.897 c -5.523 0 -10 -4.478 -10 -10 v -76 z" />
        <Rect x="81" y="37" rx="10" ry="10" width="73" height="96" />
        <Rect x="0" y="154" rx="4" ry="4" width="97" height="17" />
        <Rect x="0" y="0" rx="4" ry="4" width="97" height="17" />
        <Rect x="0" y="351" rx="8" ry="8" width="182" height="87" />
        <Rect x="201" y="351" rx="8" ry="8" width="182" height="87" />
        <Rect x="201" y="454" rx="8" ry="8" width="182" height="87" />
        <Rect x="0" y="454" rx="8" ry="8" width="182" height="87" />
      </ContentLoader>
    </View>
  )
}
