import {
  Avatar,
  AVATAR_BLURAREA_INSET,
  AvatarSelector,
  AvatarType,
  Button,
  isScreenSmall,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { loadAvatar } from 'common/utils/loadAvatar'
import React, { memo, useMemo } from 'react'
import Animated, { ZoomIn } from 'react-native-reanimated'
import { ScrollScreen } from './ScrollScreen'

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
        <Button size="large" type="primary" onPress={onSubmit}>
          {buttonText}
        </Button>
      )
    }

    return (
      <ScrollScreen
        title={title}
        subtitle={description}
        renderFooter={renderFooter}
        contentContainerStyle={{
          padding: 16,
          flex: 1
        }}>
        <View
          style={{
            justifyContent: 'center',
            flex: 1
          }}>
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
        </View>
      </ScrollScreen>
    )
  }
)
