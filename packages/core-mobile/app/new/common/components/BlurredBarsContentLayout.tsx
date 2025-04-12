import React, { PropsWithChildren, ReactElement, useMemo } from 'react'
import { Platform } from 'react-native'
import { SxProp, View } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { useBottomTabBarHeight } from 'react-native-bottom-tabs'

const BlurredBarsContentLayout: React.FC<
  PropsWithChildren & { sx?: SxProp }
> = ({ children, sx }): JSX.Element => {
  const headerHeight = useHeaderHeight()
  const bottomTabBarHeight = useBottomTabBarHeight()

  const style = useMemo(
    () => ({
      flex: 1,
      paddingTop: headerHeight,
      paddingBottom: Platform.OS === 'ios' ? bottomTabBarHeight : 0,
      ...sx
    }),
    [headerHeight, bottomTabBarHeight, sx]
  )

  const styledChildren = useMemo(
    () =>
      React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as ReactElement, {
            style: { ...child.props.style, overflow: 'visible' }
          })
        }
        return child
      }),
    [children]
  )

  return <View sx={style}>{styledChildren}</View>
}

export default BlurredBarsContentLayout
