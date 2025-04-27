import React, { useEffect } from 'react'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { Button, ScrollView, Text, View } from '@avalabs/k2-alpine'
import { useDispatch } from 'react-redux'
import { setViewOnce, ViewOnceKey } from 'store/viewOnce'
import ScreenHeader from 'common/components/ScreenHeader'
import { SafeAreaView } from 'react-native-safe-area-context'

export const AnalyticsConsent = ({
  onAcceptAnalytics,
  onRejectAnalytics
}: {
  onAcceptAnalytics: () => void
  onRejectAnalytics: () => void
}): JSX.Element => {
  const dispatch = useDispatch()

  useEffect(() => {
    return () => {
      dispatch(setViewOnce(ViewOnceKey.ANALYTICS_CONSENT))
    }
  }, [dispatch])

  return (
    <BlurredBarsContentLayout>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView sx={{ flex: 1 }} contentContainerSx={{ padding: 16 }}>
          <ScreenHeader
            title="Unlock airdrops"
            description={
              <View sx={{ gap: 20 }}>
                <Text testID="anlaysticsContent" variant="subtitle1">
                  As a Core user, you have the option to opt-in for{' '}
                  <Text variant="body1" sx={{ fontWeight: '700' }}>
                    airdrop rewards
                  </Text>{' '}
                  based on your activity and engagement. Core will collect
                  anonymous interaction data to power this feature.
                </Text>
                <Text testID="anlaysticsContent" variant="subtitle1">
                  Core is committed to protecting your privacy. We will never
                  sell or share your data. If you wish, you can disable this at
                  any time in the settings menu.
                </Text>
              </View>
            }
          />
        </ScrollView>
        <View
          sx={{
            padding: 16,
            backgroundColor: '$surfacePrimary',
            gap: 16
          }}>
          <Button size="large" type="primary" onPress={onAcceptAnalytics}>
            Unlock
          </Button>
          <Button size="large" type="tertiary" onPress={onRejectAnalytics}>
            No thanks
          </Button>
        </View>
      </SafeAreaView>
    </BlurredBarsContentLayout>
  )
}
