import {
  Avatar,
  AvatarSelector,
  AvatarType,
  Button,
  isScreenSmall,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { loadAvatar } from 'common/utils/loadAvatar'
import React, { memo, useMemo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScrollScreen } from './ScrollScreen'

export const SelectAvatar = memo(
  ({
    selectedAvatar,
    avatars,
    initialAvatar,
    title,
    isModal,
    description,
    setSelectedAvatar,
    onSubmit,
    buttonText
  }: {
    avatars: AvatarType[]
    initialAvatar?: AvatarType
    title: string
    description?: string
    selectedAvatar?: AvatarType
    setSelectedAvatar: (avatar: AvatarType) => void
    onSubmit: () => void
    isModal?: boolean
    buttonText?: string
  }): React.JSX.Element => {
    const insets = useSafeAreaInsets()
    const {
      theme: { colors }
    } = useTheme()

    const onSelect = (id: string): void => {
      const avatar = avatars.find(a => a.id === id)
      if (avatar) {
        setSelectedAvatar(avatar)
      }
    }

    const avatar = useMemo(() => {
      return loadAvatar(selectedAvatar)
    }, [selectedAvatar])

    const renderFooter = (): React.ReactNode => {
      return (
        <Button
          testID="avatar_next_button"
          size="large"
          type="primary"
          onPress={onSubmit}>
          {buttonText}
        </Button>
      )
    }

    const avatarsWithSelectedAsMiddle = useMemo(() => {
      if (!initialAvatar || !initialAvatar.source) {
        return avatars
      }

      const newAvatars = [...avatars]
      const selectedIndex = newAvatars.findIndex(
        _avatar => _avatar.id === initialAvatar.id
      )

      // Only remove the avatar if it was found in the array
      if (selectedIndex >= 0) {
        newAvatars.splice(selectedIndex, 1)
      }

      // Calculate middle position and ensure it's even (for bottom row)
      // Even indices (0, 2, 4...) appear in bottom row
      let middlePosition = Math.floor(newAvatars.length / 2)
      if (middlePosition % 2 !== 0) {
        middlePosition -= 1 // Make it even to ensure bottom row
      }

      newAvatars.splice(middlePosition, 0, initialAvatar)

      return newAvatars
    }, [avatars, initialAvatar])

    return (
      <ScrollScreen
        showNavigationHeaderTitle={false}
        title={title}
        isModal={isModal}
        subtitle={description}
        renderFooter={renderFooter}
        scrollEnabled={false}
        contentContainerStyle={{
          flex: 1
        }}
        headerStyle={{
          paddingHorizontal: 16
        }}>
        <View
          style={{
            flex: 1
          }}>
          {avatar?.source && (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              <Avatar
                backgroundColor={colors.$surfacePrimary}
                source={avatar?.source}
                size={isScreenSmall ? 100 : 'large'}
                testID="selected_avatar"
              />
            </View>
          )}

          <View
            style={{
              marginBottom: -insets.bottom,
              paddingBottom: 16
            }}>
            <AvatarSelector
              selectedId={selectedAvatar?.id}
              avatars={avatarsWithSelectedAsMiddle}
              onSelect={onSelect}
            />
          </View>
        </View>
      </ScrollScreen>
    )
  }
)
