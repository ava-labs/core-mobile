import React from 'react'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  Avatar,
  Button,
  SafeAreaView,
  ScrollView,
  View,
  useTheme,
  Text
} from '@avalabs/k2-alpine'
import { AVATARS } from 'common/consts/avatars'

export const Confirmation = ({
  selectedAvatarId,
  onNext
}: {
  selectedAvatarId?: string
  onNext: () => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const avatar = AVATARS.find(a => a.id === selectedAvatarId)

  return (
    <BlurredBarsContentLayout>
      <SafeAreaView sx={{ flex: 1 }}>
        <ScrollView sx={{ flex: 1 }} contentContainerSx={{ padding: 16 }}>
          <View sx={{ alignItems: 'center', marginTop: 100 }}>
            {avatar?.source && (
              <Avatar
                backgroundColor={colors.$surfacePrimary}
                source={avatar.source}
                size="large"
                hasBlur={true}
                glowEffect={{
                  imageSource: require('../../../../assets/glow.png'),
                  size: 380,
                  delay: 300
                }}
              />
            )}
          </View>
          <View sx={{ paddingHorizontal: 48 }}>
            <Text
              sx={{ marginTop: 96, textAlign: 'center' }}
              variant="heading3">
              That’s it!{'\n'} Enjoy your wallet
            </Text>
            <Text
              variant="subtitle1"
              sx={{ textAlign: 'center', marginTop: 20 }}>
              You can now start buying, swapping, sending, receiving crypto and
              collectibles with no added fees
            </Text>
          </View>
        </ScrollView>
        <View
          sx={{
            padding: 16,
            backgroundColor: '$surfacePrimary'
          }}>
          <Button size="large" type="primary" onPress={onNext}>
            Let’s go!
          </Button>
        </View>
      </SafeAreaView>
    </BlurredBarsContentLayout>
  )
}
