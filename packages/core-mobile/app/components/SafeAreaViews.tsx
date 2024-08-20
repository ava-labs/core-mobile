import { View, type SxProp } from '@avalabs/k2-mobile'
import React, { type FC, type PropsWithChildren } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
  sx?: SxProp
  noPaddingTop?: boolean
}

export const SafeVerticalAreaView: FC<PropsWithChildren<Props>> = ({
  children,
  sx,
  noPaddingTop
}) => {
  const insets = useSafeAreaInsets()
  return (
    <View
      sx={{
        paddingTop: !noPaddingTop ? insets.top : 0,
        paddingBottom: insets.bottom,
        flex: 1,
        ...sx
      }}>
      {children}
    </View>
  )
}

export const SafeLowerAreaView: FC<
  PropsWithChildren<Omit<Props, 'noPaddingTop'>>
> = props => <SafeVerticalAreaView noPaddingTop {...props} />
