import {
  alpha,
  Icons,
  Pressable,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Image } from 'expo-image'
import React, { ReactNode, memo } from 'react'
import { ViewStyle } from 'react-native'
import { HORIZONTAL_MARGIN } from '../consts'

interface BrowserItemProps {
  title: string
  subtitle?: string
  image?: string
  style?: ViewStyle
  renderRight?: ReactNode
  onPress: () => void
  onRemove?: () => void
}

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
    onPress
  }: BrowserItemProps): JSX.Element => {
    const { theme } = useTheme()

    return (
      <Pressable
        onPress={onPress}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            paddingLeft: HORIZONTAL_MARGIN,
            gap: 14
          },
          style
        ]}>
        <Avatar image={image} size={32} />

        <View
          sx={{
            height: 62,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flex: 1,
            borderBottomWidth: 1,
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
