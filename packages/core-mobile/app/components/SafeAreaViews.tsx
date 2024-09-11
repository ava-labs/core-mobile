import { View, type SxProp } from '@avalabs/k2-mobile'
import React, { type FC, type PropsWithChildren } from 'react'
import type { ViewProps } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
  sx?: SxProp
  noPaddingTop?: boolean
} & ViewProps
/**
 * SafeVerticalAreaView is a component that wraps the children components and adds padding to the top
 * and bottom of the screen to ensure that the content is not hidden by the device's status bar or home indicator.
 * It uses the useSafeAreaInsets hook from the react-native-safe-area-context package to get the safe area insets and adds padding
 * to the top and bottom of the screen accordingly.
 *
 * @param {ReactNode} children - The children components to be wrapped
 * @param {Object} sx - Any styling to be applied to the component
 * @param {boolean} noPaddingTop - Disable the calculated top padding
 **/
export const SafeVerticalAreaView: FC<PropsWithChildren<Props>> = ({
  children,
  sx,
  noPaddingTop,
  ...rest
}) => {
  const { top, bottom } = useSafeAreaInsets()

  return (
    <View
      sx={{
        paddingTop: !noPaddingTop ? top : 0,
        paddingBottom: bottom,
        flex: 1,
        ...sx
      }}
      {...rest}>
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
 *
 **/
export const SafeLowerAreaView: FC<SafeLowerAreaView> = props => (
  <SafeVerticalAreaView noPaddingTop {...props} />
)
