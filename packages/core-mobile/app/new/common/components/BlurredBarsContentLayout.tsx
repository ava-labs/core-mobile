import React, {
  PropsWithChildren,
  ReactElement,
  useContext,
  useMemo
} from 'react'
import { SxProp, View } from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs'

const BlurredBarsContentLayout: React.FC<
  PropsWithChildren & { sx?: SxProp }
> = ({ children, sx }): JSX.Element => {
  const headerHeight = useHeaderHeight()
  const bottomTabBarHeight = useContext(BottomTabBarHeightContext)

  const style = useMemo(
    () => ({
      flex: 1,
      paddingTop: headerHeight,
      paddingBottom: bottomTabBarHeight,
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
