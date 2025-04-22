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
import ScreenHeader from 'common/components/ScreenHeader'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AvatarType } from 'store/settings/avatar'

export const SelectAvatar = ({
  selectedAvatar,
  avatars,
  description,
  setSelectedAvatar,
  onSubmit,
  buttonText
}: {
  avatars: AvatarType[]
  description?: string
  selectedAvatar: AvatarType
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
      <ScrollView contentContainerSx={{ padding: 16 }}>
        <ScreenHeader
          title={`Select your\npersonal avatar`}
          description={description}
        />
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
              hasBlur={true}
              testID="selected_avatar"
            />
          )}
        </View>
        <View sx={{ paddingVertical: 20 }}>
          <AvatarSelector
            selectedId={selectedAvatar.id}
            avatars={avatars}
            onSelect={onSelect}
          />
        </View>
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
