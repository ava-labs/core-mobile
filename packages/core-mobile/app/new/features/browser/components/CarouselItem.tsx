import { AnimatedPressable, Icons, Text, useTheme } from '@avalabs/k2-alpine'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import React, { ReactNode } from 'react'
import { View } from 'react-native'

export const CarouselItem = ({
  title,
  image,
  description,
  renderImage,
  onPress
}: {
  title: string
  image?: string
  description?: string
  renderImage?: ReactNode
  onPress: () => void
}): ReactNode => {
  const { theme } = useTheme()

  return (
    <AnimatedPressable
      style={{
        width: 240,
        height: 300,
        borderRadius: 18,
        backgroundColor: theme.isDark ? '#484848' : '#F2F2F3',
        padding: 22,
        gap: 8,
        borderColor: theme.colors.$borderPrimary,
        borderWidth: 1,
        overflow: 'hidden'
      }}
      onPress={onPress}>
      {renderImage ? (
        renderImage
      ) : image ? (
        <BlurView
          tint={theme.isDark ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1
          }}>
          <View
            style={{
              position: 'absolute',
              bottom: -12,
              left: 22
            }}>
            <Image
              source={image}
              style={{ width: 150, height: 150, borderRadius: 100 }}
            />
          </View>
        </BlurView>
      ) : null}

      <View style={{ zIndex: 10, gap: 8 }}>
        <Text variant="heading3">{title}</Text>
        {description ? (
          <Text variant="subtitle1">{description}</Text>
        ) : (
          <Icons.Custom.ArrowOutward
            width={42}
            height={42}
            color={theme.colors.$textPrimary}
            style={{
              left: -10
            }}
          />
        )}
      </View>

      <View
        style={{
          position: 'absolute',
          zIndex: -1,
          bottom: -72,
          left: -38,
          opacity: 0.15
        }}>
        <Image
          source={image}
          style={{
            width: 270,
            height: 270,
            borderRadius: 270
          }}
        />
      </View>
    </AnimatedPressable>
  )
}
