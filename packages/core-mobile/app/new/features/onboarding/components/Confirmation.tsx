import {
  ActivityIndicator,
  Avatar,
  Button,
  Text,
  View,
  useTheme
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useState } from 'react'
import { Platform } from 'react-native'
import { useSelector } from 'react-redux'
import { selectSelectedAvatar } from 'store/settings/avatar'

export const Confirmation = ({
  onNext
}: {
  onNext: () => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const avatar = useSelector(selectSelectedAvatar)

  const handleOnPress = useCallback((): void => {
    setIsLoading(true)
    setTimeout(() => {
      onNext()
    }, 100)
  }, [onNext])

  const renderFooter = useCallback((): React.ReactNode => {
    return (
      <Button
        testID="lets_go_btn"
        size="large"
        type="primary"
        onPress={handleOnPress}
        disabled={isLoading}>
        {isLoading ? <ActivityIndicator /> : `Let's go!`}
      </Button>
    )
  }, [isLoading, handleOnPress])

  return (
    <ScrollScreen
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View
        sx={{
          alignItems: 'center',
          flex: 1,
          gap: 76,
          justifyContent: 'center'
        }}>
        {avatar?.source && (
          <Avatar
            backgroundColor={colors.$surfacePrimary}
            source={avatar.source}
            size="large"
            hasBlur={Platform.OS === 'ios'}
            glowEffect={{
              imageSource: require('../../../../assets/glow.png'),
              size: 380,
              delay: 300
            }}
            testID="selected_avatar"
          />
        )}
        <View
          sx={{
            paddingHorizontal: 12,
            maxWidth: 320,
            alignSelf: 'center'
          }}>
          <Text sx={{ textAlign: 'center' }} variant="heading3">
            {`That's it!\nEnjoy your wallet`}
          </Text>
          <Text
            variant="subtitle1"
            sx={{
              textAlign: 'center',
              marginTop: 20
            }}>
            You can now start buying, swapping, sending, receiving crypto and
            collectibles
          </Text>
        </View>
      </View>
    </ScrollScreen>
  )
}
