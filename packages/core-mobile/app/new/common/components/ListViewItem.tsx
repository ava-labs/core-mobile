import {
  Avatar,
  AvatarType,
  Icons,
  Image,
  Text,
  TextVariant,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useCallback } from 'react'
import { TextProps } from 'react-native-svg'

export const ListViewItem = ({
  isLast,
  title,
  subtitle,
  avatar,
  image,
  showArrow,
  titleProps,
  subtitleProps,
  onPress,
  renderLeft,
  renderTop,
  renderTitle,
  renderSubtitle,
  renderRight
}: {
  isLast: boolean
  title: string
  subtitle?: string
  avatar?: AvatarType
  image?: string
  showArrow?: boolean
  titleProps?: TextProps & { variant?: TextVariant }
  subtitleProps?: TextProps & { variant?: TextVariant }
  onPress: () => void
  renderLeft?: () => React.ReactNode
  renderTop?: () => React.ReactNode
  renderTitle?: () => React.ReactNode
  renderSubtitle?: () => React.ReactNode
  renderRight?: () => React.ReactNode
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const renderLeftComponent = useCallback(() => {
    if (renderLeft) return renderLeft()
    if (avatar?.source)
      return (
        <Avatar
          backgroundColor="transparent"
          size={40}
          source={avatar?.source}
          hasLoading={false}
        />
      )
    if (image && typeof image === 'string')
      return <Image width={40} height={40} source={{ uri: image }} />
    return null
  }, [avatar?.source, image, renderLeft])

  const renderRightComponent = useCallback(() => {
    if (renderRight) return renderRight()
    if (showArrow)
      return (
        <Icons.Navigation.ChevronRight
          width={20}
          height={20}
          color={colors.$textSecondary}
        />
      )
    return null
  }, [colors.$textSecondary, renderRight, showArrow])

  const renderTitleComponent = useCallback(() => {
    if (renderTitle) return renderTitle()
    return (
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
    )
  }, [renderTitle, title, titleProps])

  const renderSubtitleComponent = useCallback(() => {
    if (renderSubtitle) return renderSubtitle()
    if (subtitle)
      return (
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
      )
    return null
  }, [renderSubtitle, subtitle, subtitleProps])

  return (
    <TouchableOpacity
      sx={{
        justifyContent: 'space-between',
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
        minHeight: 60
      }}
      onPress={onPress}>
      {renderLeftComponent()}

      <View
        sx={{
          flex: 1,
          marginLeft: 12,
          paddingRight: 12,
          paddingVertical: 12,
          minHeight: 60,
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
          {renderTop?.()}
          {renderTitleComponent()}
          {renderSubtitleComponent()}
        </View>

        {renderRightComponent()}
      </View>
    </TouchableOpacity>
  )
}
