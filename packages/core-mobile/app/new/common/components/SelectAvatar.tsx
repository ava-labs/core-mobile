import {
  Avatar,
  AVATAR_BLURAREA_INSET,
  AvatarSelector,
  AvatarType,
  Button,
  isScreenSmall,
  ScrollView,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import ScreenHeader from 'common/components/ScreenHeader'
import { loadAvatar } from 'common/utils/loadAvatar'
import React, { memo, useMemo } from 'react'
import Animated, { ZoomIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const SelectAvatar = memo(
  ({
    selectedAvatar,
    avatars,
    title,
    description,
    setSelectedAvatar,
    onSubmit,
    buttonText
  }: {
    avatars: AvatarType[]
    title: string
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

    const avatar = useMemo(() => {
      return loadAvatar(selectedAvatar)
    }, [selectedAvatar])

    return (
      <View sx={{ flex: 1 }}>
        <ScrollView>
          <View
            style={{
              padding: 16
            }}>
            <ScreenHeader title={title} description={description} />
          </View>
          <Animated.View entering={ZoomIn.delay(400)}>
            <View
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: AVATAR_BLURAREA_INSET
              }}>
              {avatar?.source && (
                <Avatar
                  backgroundColor={colors.$surfacePrimary}
                  source={avatar?.source}
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
