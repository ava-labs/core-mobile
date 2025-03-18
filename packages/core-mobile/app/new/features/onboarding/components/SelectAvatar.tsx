import React from 'react'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  Avatar,
  Button,
  ScrollView,
  View,
  AvatarSelector,
  useTheme,
  AVATAR_BLURAREA_INSET,
  isScreenSmall
} from '@avalabs/k2-alpine'
import { ImageSourcePropType } from 'react-native'
import ScreenHeader from 'common/components/ScreenHeader'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const SelectAvatar = ({
  avatars,
  selectedAvatarId,
  setSelectedAvatarId,
  onNext
}: {
  avatars: { id: string; source: ImageSourcePropType }[]
  selectedAvatarId?: string
  setSelectedAvatarId: (id: string) => void
  onNext: () => void
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { bottom } = useSafeAreaInsets()

  const avatar = avatars.find(a => a.id === selectedAvatarId)

  return (
    <BlurredBarsContentLayout>
      <ScrollView contentContainerSx={{ padding: 16 }}>
        <ScreenHeader
          title={`Select your\npersonal avatar`}
          description="Add a display avatar for your wallet. You can change it at any time in the app's settings"
        />
        <View
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: AVATAR_BLURAREA_INSET
          }}>
          {avatar?.source && (
            <Avatar
              backgroundColor={colors.$surfacePrimary}
              source={avatar.source}
              size={isScreenSmall ? 100 : 'large'}
              hasBlur={true}
              testID="selected_avatar"
            />
          )}
        </View>
        <View sx={{ paddingVertical: 20 }}>
          <AvatarSelector
            selectedId={selectedAvatarId}
            avatars={avatars}
            onSelect={setSelectedAvatarId}
          />
        </View>
      </ScrollView>
      <View
        sx={{
          padding: 16,
          paddingBottom: bottom + 16,
          backgroundColor: '$surfacePrimary'
        }}>
        <Button size="large" type="primary" onPress={onNext}>
          Next
        </Button>
      </View>
    </BlurredBarsContentLayout>
  )
}
