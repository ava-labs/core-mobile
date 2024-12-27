import React from 'react'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'
import {
  Avatar,
  Button,
  SafeAreaView,
  ScrollView,
  View,
  AvatarSelector,
  useTheme
} from '@avalabs/k2-alpine'
import { ImageSourcePropType, Platform } from 'react-native'
import { KeyboardAvoidingView } from 'react-native'
import ScreenHeader from 'new/components/ScreenHeader'

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

  const avatar = avatars.find(a => a.id === selectedAvatarId)

  return (
    <BlurredBarsContentLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView sx={{ flex: 1 }}>
          <ScrollView sx={{ flex: 1 }} contentContainerSx={{ padding: 16 }}>
            <ScreenHeader
              title={`Select your ${'\n'}personal avatar`}
              description="Add a display avatar for your wallet. You can change it at any time in the app’s settings"
            />
          </ScrollView>
          <View
            sx={{ alignItems: 'center', paddingBottom: 44, paddingTop: 61 }}>
            {avatar?.source && (
              <Avatar
                backgroundColor={colors.$surfacePrimary}
                source={avatar.source}
                size="large"
                hasBlur={true}
              />
            )}
          </View>
          <AvatarSelector
            selectedId={selectedAvatarId}
            avatars={avatars}
            onSelect={setSelectedAvatarId}
          />
          <View
            sx={{
              padding: 16,
              paddingTop: 58,
              backgroundColor: '$surfacePrimary'
            }}>
            <Button size="large" type="primary" onPress={onNext}>
              Next
            </Button>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </BlurredBarsContentLayout>
  )
}
