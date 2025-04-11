import { AnimatedPressable, Icons, Text, useTheme } from '@avalabs/k2-alpine'
import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { CardContainer } from 'features/portfolio/collectibles/components/CardContainer'
import React, { ReactNode, useCallback } from 'react'
import ContentLoader, { Rect } from 'react-content-loader/native'
import { Platform, View } from 'react-native'

export const CarouselItem = ({
  title,
  image,
  description,
  renderImage,
  loading,
  onPress
}: {
  title?: string
  image?: string
  description?: string
  loading?: boolean
  renderImage?: ReactNode
  onPress?: () => void
}): ReactNode => {
  const { theme } = useTheme()

  const renderContent = useCallback(() => {
    return (
      <View
        style={{
          flex: 1,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}>
        {renderImage ? (
          renderImage
        ) : image ? (
          Platform.OS === 'ios' ? (
            <>
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
                    width: 260,
                    height: 260,
                    borderRadius: 260
                  }}
                />
              </View>
              <BlurView
                intensity={60}
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
            </>
          ) : (
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
          )
        ) : null}

        <View style={{ zIndex: 10, gap: 8, padding: 22 }}>
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
      </View>
    )
  }, [
    description,
    image,
    renderImage,
    theme.colors.$textPrimary,
    theme.isDark,
    title
  ])

  if (loading) {
    return (
      <CardContainer
        style={{
          width: 240,
          height: 300,
          justifyContent: 'flex-start',
          alignItems: 'flex-start'
        }}>
        <ContentLoader
          speed={1}
          width={240}
          height={300}
          viewBox={`0 0 240 300`}
          foregroundColor={theme.isDark ? '#69696D' : '#D9D9D9'}
          backgroundColor={theme.isDark ? '#3E3E43' : '#F2F2F3'}>
          <Rect x="0" y="0" width={240} height={300} />
        </ContentLoader>
      </CardContainer>
    )
  }

  return (
    <AnimatedPressable
      style={{
        width: 240,
        height: 300
      }}
      onPress={onPress}>
      <CardContainer
        style={{
          height: '100%',
          width: '100%',
          justifyContent: 'flex-start',
          alignItems: 'flex-start'
        }}>
        {renderContent()}
      </CardContainer>
    </AnimatedPressable>
  )
}
