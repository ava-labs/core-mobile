import { BlurView } from 'expo-blur'
import React, { FC, PropsWithChildren, useMemo } from 'react'
import { ViewStyle } from 'react-native'
import { alpha } from '../../utils'

export type GlassType = 'light' | 'light2' | 'dark' | 'dark2' | 'dark3'

export const GlassView: FC<
  {
    style?: ViewStyle
    glassType?: GlassType
  } & PropsWithChildren
> = ({ style, glassType, children }): JSX.Element => {
  const backgroundColor = useMemo(() => {
    if (!glassType) return undefined

    switch (glassType) {
      case 'light':
        return alpha('#FFFFFF', 0.6)
      case 'light2':
        return alpha('#A1A1AA', 0.25)
      case 'dark':
        return alpha('#28282E', 0.85)
      case 'dark2':
        return alpha('#818189', 0.6)
      case 'dark3':
        return alpha('#C5C5C8', 0.25)
    }
  }, [glassType])

  return (
    <BlurView
      style={{
        ...style,
        ...(backgroundColor ? { backgroundColor } : {})
      }}
      intensity={50}
      experimentalBlurMethod="dimezisBlurView">
      {children}
    </BlurView>
  )
}
