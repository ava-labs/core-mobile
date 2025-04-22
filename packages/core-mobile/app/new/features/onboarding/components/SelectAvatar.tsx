import {
  Avatar,
  AVATAR_BLURAREA_INSET,
  AvatarSelector,
  Button,
  isScreenSmall,
  ScrollView,
  useTheme,
  View
} from '@avalabs/k2-alpine'
// import { AvatarSelector } from 'common/components/AvatarSelector'
import ScreenHeader from 'common/components/ScreenHeader'
import React, { memo } from 'react'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AvatarType } from 'store/settings/avatar'

export const SelectAvatar = memo(
  ({
    selectedAvatar,
    avatars,
    description,
    setSelectedAvatar,
    onSubmit,
    buttonText
  }: {
    avatars: AvatarType[]
    description?: string
    selectedAvatar?: AvatarType
    setSelectedAvatar: (avatar: AvatarType) => void
    onSubmit: () => void
    buttonText?: string
  }): React.JSX.Element => {
    const {
      theme: { colors }
    } = useTheme()
    const { bottom } = useSafeAreaInsets()

    const onSelect = (id: string): void => {
      const avatar = avatars.find(a => a.id === id)
      if (avatar) {
        setSelectedAvatar(avatar)
      }
    }

    return (
      <View sx={{ flex: 1 }}>
        <ScrollView>
          <View
            style={{
              padding: 16
            }}>
            <ScreenHeader
              title={`Select your\npersonal avatar`}
              description={description}
            />
          </View>
          <Animated.View entering={FadeIn.delay(400)}>
            <View
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: AVATAR_BLURAREA_INSET
              }}>
              {selectedAvatar?.source && (
                <Avatar
                  backgroundColor={colors.$surfacePrimary}
                  source={selectedAvatar.source}
                  size={isScreenSmall ? 100 : 'large'}
                  testID="selected_avatar"
                />
              )}
            </View>
          </Animated.View>

          <AvatarSelector
            selectedId={selectedAvatar?.id}
            avatars={avatars}
            onSelect={onSelect}
          />
        </ScrollView>
        <View
          sx={{
            padding: 16,
            paddingBottom: bottom + 16,
            backgroundColor: '$surfacePrimary'
          }}>
          <Button size="large" type="primary" onPress={onSubmit}>
            {buttonText}
          </Button>
        </View>
      </View>
    )
  }
)
