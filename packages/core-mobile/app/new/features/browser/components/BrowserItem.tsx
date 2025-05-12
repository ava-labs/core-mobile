import {
  alpha,
  Icons,
  Pressable,
  SCREEN_WIDTH,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { BlurViewWithFallback } from 'common/components/BlurViewWithFallback'
import { Image } from 'expo-image'
import React, { memo, ReactNode } from 'react'
import ContentLoader, { Circle, Rect } from 'react-content-loader/native'
import { ViewStyle, Platform } from 'react-native'
import { HORIZONTAL_MARGIN } from '../consts'

interface BrowserItemProps {
  title?: string
  subtitle?: string
  image?: string
  style?: ViewStyle
  isFavorite?: boolean
  renderRight?: ReactNode
  isLast?: boolean
  loading?: boolean
  onPress?: () => void
  onRemove?: () => void
}

const LIST_ITEM_HEIGHT = 62

export const BrowserItem = memo(
  ({
    type,
    ...props
  }: BrowserItemProps & { type: 'grid' | 'list' }): JSX.Element => {
    if (type === 'grid') return <GridItem {...props} />
    return <ListItem {...props} />
  }
)

export const GridItem = memo(
  ({ title, image, isFavorite, style }: BrowserItemProps): ReactNode => {
    const { theme } = useTheme()
    return (
      <View
        style={[
          {
            alignItems: 'center',
            gap: HORIZONTAL_MARGIN / 2,
            width: '100%',
            paddingVertical: 12
          },
          style
        ]}>
        <View>
          {isFavorite ? (
            <View
              style={{
                position: 'absolute',
                top: -7,
                right: -7,
                zIndex: 1000,
                backgroundColor:
                  Platform.OS === 'android'
                    ? theme.colors.$surfacePrimary
                    : 'transparent',
                borderRadius: 100
              }}>
              <BlurViewWithFallback
                intensity={20}
                style={{
                  width: 24,
                  height: 24,
                  backgroundColor: theme.colors.$borderPrimary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  borderRadius: 100
                }}>
                <Icons.Toggle.StarFilled
                  width={12}
                  height={12}
                  color={theme.colors.$textSecondary}
                />
              </BlurViewWithFallback>
            </View>
          ) : null}
          <Avatar image={image} size={48} />
        </View>

        <Text
          style={{
            fontFamily: 'Inter-Medium',
            fontSize: 13
          }}
          numberOfLines={1}>
          {title}
        </Text>
      </View>
    )
  }
)

export const ListItem = memo(
  ({
    title,
    subtitle,
    image,
    style,
    renderRight,
    onRemove,
    onPress,
    isLast,
    loading
  }: BrowserItemProps): JSX.Element => {
    const { theme } = useTheme()

    if (loading) {
      return (
        <View
          style={{
            flex: 1,
            gap: 14,
            height: LIST_ITEM_HEIGHT
          }}>
          <ContentLoader
            speed={1}
            width={SCREEN_WIDTH}
            viewBox={`0 0 ${SCREEN_WIDTH} ${LIST_ITEM_HEIGHT}`}
            foregroundColor={theme.isDark ? '#69696D' : '#D9D9D9'}
            backgroundColor={theme.isDark ? '#3E3E43' : '#F2F2F3'}>
            <Circle cx={HORIZONTAL_MARGIN + 18} cy={18} r={18} />
            <Rect
              x={HORIZONTAL_MARGIN + 36 + 15}
              y={3}
              width={80}
              height={14}
              rx={6}
              ry={6}
            />
            <Rect
              x={HORIZONTAL_MARGIN + 36 + 15}
              y={14 + 6}
              width={120}
              height={13}
              rx={6}
              ry={6}
            />
            {!isLast ? (
              <Rect
                x={HORIZONTAL_MARGIN + 36 + 15}
                y={36 + 11}
                width={SCREEN_WIDTH}
                height={1}
                rx={4}
                ry={4}
              />
            ) : null}
          </ContentLoader>
        </View>
      )
    }

    return (
      <Pressable
        onPress={onPress}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            paddingLeft: HORIZONTAL_MARGIN,
            gap: 15
          },
          style
        ]}>
        <Avatar image={image} size={36} />

        <View
          sx={{
            height: LIST_ITEM_HEIGHT,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flex: 1,
            borderBottomWidth: isLast ? 0 : 1,
            borderColor: theme.colors.$borderPrimary,
            paddingRight: HORIZONTAL_MARGIN,
            gap: HORIZONTAL_MARGIN
          }}>
          <View sx={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: 'Inter-Medium'
              }}>
              {title}
            </Text>
            <Text
              variant="subtitle2"
              sx={{
                color: '$textSecondary'
              }}
              numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          {onRemove ? (
            <Pressable hitSlop={8} onPress={onRemove}>
              <Icons.Content.Close
                width={24}
                height={24}
                color={theme.colors.$textPrimary}
              />
            </Pressable>
          ) : (
            renderRight || null
          )}
        </View>
      </Pressable>
    )
  }
)

const Avatar = memo(
  ({ image, size = 32 }: { image?: string; size?: number }): ReactNode => {
    const { theme } = useTheme()

    if (image)
      return (
        <Image
          source={image}
          renderToHardwareTextureAndroid={false}
          style={{
            width: size,
            height: size,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 100,
            borderWidth: 1,
            borderColor: theme.colors.$borderPrimary,
            backgroundColor: alpha(
              theme.isDark ? theme.colors.$white : theme.colors.$textPrimary,
              0.1
            )
          }}
        />
      )

    return (
      <View
        style={{
          width: size,
          height: size,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.colors.$borderPrimary,
          backgroundColor: alpha(
            theme.isDark ? theme.colors.$white : theme.colors.$textPrimary,
            0.1
          ),
          borderRadius: 100
        }}>
        <Icons.Navigation.History color={theme.colors.$textPrimary} />
      </View>
    )
  }
)
