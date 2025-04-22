import React, { useCallback, useState } from 'react'
import {
  Button,
  Icons,
  SafeAreaView,
  Text,
  Toggle,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { setViewOnce, ViewOnceKey } from 'store/viewOnce'
import { useDispatch } from 'react-redux'

export const SendTutorialScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { replace } = useRouter()
  const dispatch = useDispatch()
  const [hideOnboarding, setHideOnboarding] = useState(false)

  const handleGoToRecentContacts = useCallback((): void => {
    hideOnboarding && dispatch(setViewOnce(ViewOnceKey.SEND_ONBOARDING))
    replace('/send/recentContacts')
  }, [replace, hideOnboarding, dispatch])

  return (
    <SafeAreaView
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16
      }}>
      <View
        sx={{ justifyContent: 'center', alignItems: 'center', marginTop: 54 }}>
        <Icons.Custom.Send width={62} height={62} color={colors.$textPrimary} />
        <Text
          variant="heading3"
          style={{
            marginTop: 32,
            lineHeight: 30,
            color: '$textPrimary',
            textAlign: 'center'
          }}>
          {`Send tokens to an address\nor contact`}
        </Text>

        <Text
          variant="subtitle1"
          style={{
            marginTop: 13,
            color: '$textPrimary',
            textAlign: 'center'
          }}>
          {`Send tokens to any address or contact\non a given network`}
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: 16,
          marginTop: 12,
          gap: 22,
          marginBottom: 40
        }}>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.$surfaceSecondary,
            borderRadius: 12,
            justifyContent: 'space-between',
            width: '100%',
            paddingLeft: 16,
            paddingRight: 11,
            paddingVertical: 13
          }}>
          <Text variant="subtitle1">Hide this screen next time</Text>
          <Toggle value={hideOnboarding} onValueChange={setHideOnboarding} />
        </View>
        <Button type="primary" size="large" onPress={handleGoToRecentContacts}>
          Let’s go!
        </Button>
      </View>
    </SafeAreaView>
  )
}
