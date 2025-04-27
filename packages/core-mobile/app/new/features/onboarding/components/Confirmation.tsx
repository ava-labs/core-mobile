import React from 'react'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  Avatar,
  Button,
  ScrollView,
  View,
  useTheme,
  Text
} from '@avalabs/k2-alpine'
import { selectSelectedAvatar } from 'store/settings/avatar'
import { useSelector } from 'react-redux'
import { SafeAreaView } from 'react-native-safe-area-context'

export const Confirmation = ({
  onNext
}: {
  onNext: () => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const avatar = useSelector(selectSelectedAvatar)

  return (
    <BlurredBarsContentLayout>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView sx={{ flex: 1 }} contentContainerSx={{ padding: 16 }}>
          <View sx={{ alignItems: 'center', marginTop: 100 }}>
            {avatar?.source && (
              <Avatar
                backgroundColor={colors.$surfacePrimary}
                source={avatar.source}
                size="large"
                glowEffect={{
                  imageSource: require('../../../../assets/glow.png'),
                  size: 380,
                  delay: 300
                }}
                testID="selected_avatar"
              />
            )}
          </View>
          <View
            sx={{
              paddingHorizontal: 12,
              maxWidth: 320,
              alignSelf: 'center'
            }}>
            <Text
              sx={{ marginTop: 96, textAlign: 'center' }}
              variant="heading3">
              That’s it!{'\n'} Enjoy your wallet
            </Text>
            <Text
              variant="subtitle1"
              sx={{
                textAlign: 'center',
                marginTop: 20
              }}>
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
          <Button
            testID="lets_go_btn"
            size="large"
            type="primary"
            onPress={onNext}>
            Let’s go!
          </Button>
        </View>
      </SafeAreaView>
    </BlurredBarsContentLayout>
  )
}
