import React from 'react'
import {
  AvatarType,
  View,
  TouchableOpacity,
  useTheme,
  Avatar,
  Text,
  Icons,
  TextVariant
} from '@avalabs/k2-alpine'
import { TextProps } from 'react-native-svg'

export const ListViewItem = ({
  onPress,
  renderTop,
  avatar,
  title,
  subtitle,
  isLast,
  hideArrow,
  titleProps,
  subtitleProps
}: {
  onPress: () => void
  avatar?: AvatarType
  renderTop?: React.ReactNode
  title: string
  subtitle?: string
  isLast: boolean
  hideArrow?: boolean
  titleProps?: TextProps & { variant?: TextVariant }
  subtitleProps?: TextProps & { variant?: TextVariant }
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <TouchableOpacity
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row'
      }}
      onPress={onPress}>
      <View
        sx={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 16
        }}>
        <View
          sx={{
            width: 40,
            height: 40
          }}>
          <Avatar
            backgroundColor="transparent"
            size={40}
            source={avatar?.source}
            hasLoading={false}
          />
        </View>
        <View
          sx={{
            flex: 1,
            marginLeft: 12,
            paddingRight: 12,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderColor: isLast ? 'transparent' : '$borderPrimary'
          }}>
          <View
            sx={{
              flex: 1,
              justifyContent: 'center'
            }}>
            {renderTop}
            <Text
              {...titleProps}
              variant="buttonMedium"
              numberOfLines={1}
              sx={{
                // this is needed for emojis to be displayed correctly
                lineHeight: 20
              }}>
              {title}
            </Text>
            {subtitle && (
              <Text
                {...subtitleProps}
                sx={{
                  fontSize: 13,
                  color: '$textSecondary'
                }}
                ellipsizeMode="tail"
                numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>

          {hideArrow ? null : (
            <Icons.Navigation.ChevronRight
              width={20}
              height={20}
              color={colors.$textSecondary}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}
