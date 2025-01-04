import React, { PropsWithChildren, ReactElement, useContext } from 'react'
import { SxProp, View } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs'

const BlurredBarsContentLayout: React.FC<
  PropsWithChildren & { sx?: SxProp }
> = ({ children, sx }): JSX.Element => {
  const headerHeight = useHeaderHeight()
  const bottomTabBarHeight = useContext(BottomTabBarHeightContext)

  const styledChildren = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as ReactElement, {
        style: { ...child.props.style, overflow: 'visible' }
      })
    }
    return child
  })

  return (
    <View
      sx={{
        flex: 1,
        paddingTop: headerHeight,
        paddingBottom: bottomTabBarHeight,
        ...sx
      }}>
      {styledChildren}
    </View>
  )
}

export default BlurredBarsContentLayout
