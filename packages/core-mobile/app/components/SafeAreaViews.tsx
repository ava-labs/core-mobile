import { View, type SxProp } from '@avalabs/k2-mobile'
import React, { type FC, type PropsWithChildren } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
  sx?: SxProp
  noPaddingTop?: boolean
  inTabNavigation?: boolean
}
/**
 * SafeVerticalAreaView is a component that wraps the children components and adds padding to the top
 * and bottom of the screen to ensure that the content is not hidden by the device's status bar or home indicator.
 * It uses the useSafeAreaInsets hook from the react-native-safe-area-context package to get the safe area insets and adds padding
 * to the top and bottom of the screen accordingly.
 *
 * @param {ReactNode} children - The children components to be wrapped
 * @param {Object} sx - Any styling to be applied to the component
 * @param {boolean} noPaddingTop - Disable the calculated top padding
 * @param {boolean} inTabNavigation - Modify the bottom padding when the screen is part of a tab navigation
 **/
export const SafeVerticalAreaView: FC<PropsWithChildren<Props>> = ({
  children,
  sx,
  noPaddingTop,
  inTabNavigation
}) => {
  const insets = useSafeAreaInsets()
  const bottomModifier = inTabNavigation ? 2 : 1

  return (
    <View
      sx={{
        paddingTop: !noPaddingTop ? insets.top : 0,
        paddingBottom: insets.bottom / bottomModifier,
        flex: 1,
        ...sx
      }}>
      {children}
    </View>
  )
}

type SafeLowerAreaView = PropsWithChildren<Omit<Props, 'noPaddingTop'>>

/**
 * SafeLowerAreaView is a component that wraps the children components and adds padding to the bottom of the screen only.
 * It uses the useSafeAreaInsets hook from the react-native-safe-area-context package to get the safe area insets and adds padding
 * to the bottom of the screen accordingly.
 *
 * @param {ReactNode} children - The children components to be wrapped
 * @param {Object} sx - Any styling to be applied to the component
 * @param {boolean} inTabNavigation - Modify the bottom padding when the screen is part of a tab navigation
 *
 **/
export const SafeLowerAreaView: FC<SafeLowerAreaView> = props => (
  <SafeVerticalAreaView noPaddingTop {...props} />
)
