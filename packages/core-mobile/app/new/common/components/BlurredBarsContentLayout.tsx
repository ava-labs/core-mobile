import { SxProp, View } from '@avalabs/k2-alpine'
import React, {
  PropsWithChildren,
  ReactElement,
  useContext,
  useMemo
} from 'react'
import { Platform } from 'react-native'
import { BottomTabBarHeightContext } from 'react-native-bottom-tabs'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'

const BlurredBarsContentLayout: React.FC<
  PropsWithChildren & { sx?: SxProp }
> = ({ children, sx }): JSX.Element => {
  const headerHeight = useEffectiveHeaderHeight()

  // safe access to tab bar height using context directly
  // as we currently have screens that are not using the bottom tab navigator
  const bottomTabBarHeight = useContext(BottomTabBarHeightContext) ?? 0

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
          // We don't care about the element's props type here, we only need to merge `style`.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return React.cloneElement(child as ReactElement<any>, {
            style: [
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (child as ReactElement<any>).props?.style || {},
              { overflow: 'visible' }
            ]
          })
        }
        return child
      }),
    [children]
  )

  return <View sx={style}>{styledChildren}</View>
}

export default BlurredBarsContentLayout
