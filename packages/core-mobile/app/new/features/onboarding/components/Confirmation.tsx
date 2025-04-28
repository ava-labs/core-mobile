import React from 'react'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  Avatar,
  Button,
  ScrollView,
  View,
  useTheme,
  Text,
  SafeAreaView
} from '@avalabs/k2-alpine'
import { selectSelectedAvatar } from 'store/settings/avatar'
import { useSelector } from 'react-redux'
import { ScrollViewScreenTemplate } from 'common/components/ScrollViewScreenTemplate'

export const Confirmation = ({
  onNext
}: {
  onNext: () => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const avatar = useSelector(selectSelectedAvatar)

  const renderFooter = (): React.ReactNode => {
    return (
      <Button testID="lets_go_btn" size="large" type="primary" onPress={onNext}>
        Let's go!
      </Button>
    )
  }

  return (
    <ScrollViewScreenTemplate
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
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
        <Text sx={{ marginTop: 96, textAlign: 'center' }} variant="heading3">
          {`That's it!\nEnjoy your wallet`}
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
    </ScrollViewScreenTemplate>
  )
}
