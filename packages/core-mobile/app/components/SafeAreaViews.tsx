import { View, type SxProp } from '@avalabs/k2-mobile'
import React, { type FC, type PropsWithChildren } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
  sx?: SxProp
  noPaddingTop?: boolean
  inTabNavigation?: boolean
}

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

export const SafeLowerAreaView: FC<SafeLowerAreaView> = props => (
  <SafeVerticalAreaView noPaddingTop {...props} />
)
