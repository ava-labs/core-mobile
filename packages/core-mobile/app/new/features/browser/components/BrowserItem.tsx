import {
  alpha,
  Icons,
  Pressable,
  SCREEN_WIDTH,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Image } from 'expo-image'
import React, { memo, ReactNode } from 'react'
import ContentLoader, { Circle, Rect } from 'react-content-loader/native'
import { ViewStyle } from 'react-native'
import { HORIZONTAL_MARGIN } from '../consts'

interface BrowserItemProps {
  title?: string
  subtitle?: string
  image?: string
  style?: ViewStyle
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
  ({ title, image, style, onPress }: BrowserItemProps): ReactNode => {
    return (
      <Pressable
        onPress={onPress}
        style={[
          {
            alignItems: 'center',
            gap: HORIZONTAL_MARGIN / 2,
            width: '100%',
            paddingVertical: 12
          },
          style
        ]}>
        <Avatar image={image} size={48} />

        <Text
          style={{
            fontFamily: 'Inter-Medium',
            fontSize: 13
          }}
          numberOfLines={1}>
          {title}
        </Text>
      </Pressable>
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
