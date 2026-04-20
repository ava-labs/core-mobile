import {
  Icons,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListScreen } from 'common/components/ListScreen'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { ListRenderItemInfo } from 'react-native'
import {
  AppIcon,
  APP_ICON_DISPLAY_NAMES,
  APP_ICON_SUBTITLES,
  ICON_PREVIEWS,
  useAppIcon
} from 'features/accountSettings/store'

// NOTE: setAlternateIconName does not work on the iOS 26 simulator.
// For development, use an iOS 18 simulator or an iOS 26 physical device.

const ALL_ICONS = Object.values(AppIcon)
const ICON_THUMBNAIL_SIZE = 48

export const SelectAppIconScreen = (): JSX.Element => {
  const { currentIcon, setIcon } = useAppIcon()
  const { canGoBack, back } = useRouter()

  const handleIconPress = useCallback(
    (icon: AppIcon) => {
      setIcon(icon)
      if (icon !== currentIcon && canGoBack()) {
        back()
      }
    },
    [currentIcon, setIcon, canGoBack, back]
  )

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<AppIcon>) => {
      return (
        <AppIconRow
          icon={item}
          isSelected={currentIcon === item}
          isLast={index === ALL_ICONS.length - 1}
          onPress={() => handleIconPress(item)}
        />
      )
    },
    [currentIcon, handleIconPress]
  )

  return (
    <ListScreen
      title={`Customize\nthe app icon`}
      navigationTitle="Customize the app icon"
      isModal
      data={ALL_ICONS}
      keyExtractor={item => item}
      renderItem={renderItem}
    />
  )
}

const AppIconRow = ({
  icon,
  isSelected,
  isLast,
  onPress
}: {
  icon: AppIcon
  isSelected: boolean
  isLast: boolean
  onPress: () => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const subtitle = APP_ICON_SUBTITLES[icon]
  const iconSource = ICON_PREVIEWS[icon]
  const accessibilityLabel = `${APP_ICON_DISPLAY_NAMES[icon]}${
    isSelected ? ', selected' : ''
  }`

  return (
    <TouchableOpacity
      testID={
        isSelected
          ? `app_icon_${APP_ICON_DISPLAY_NAMES[icon]}_selected`
          : `app_icon_${APP_ICON_DISPLAY_NAMES[icon]}`
      }
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      sx={{ paddingHorizontal: 16 }}>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12
        }}>
        <View
          sx={{
            width: ICON_THUMBNAIL_SIZE,
            height: ICON_THUMBNAIL_SIZE,
            borderWidth: 1,
            borderColor: colors.$borderPrimary,
            borderRadius: 12,
            overflow: 'hidden'
          }}>
          <Image
            source={iconSource}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </View>
        <View sx={{ flex: 1, marginLeft: 12 }}>
          <Text variant="buttonMedium" numberOfLines={1}>
            {APP_ICON_DISPLAY_NAMES[icon]}
          </Text>
          {subtitle !== undefined && (
            <Text
              variant="body2"
              sx={{
                color: colors.$textSecondary,
                lineHeight: 16,
                marginTop: 2
              }}
              numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {isSelected && <Icons.Navigation.Check color={colors.$textPrimary} />}
      </View>
      {!isLast && (
        <View sx={{ marginLeft: ICON_THUMBNAIL_SIZE + 12 }}>
          <Separator />
        </View>
      )}
    </TouchableOpacity>
  )
}
