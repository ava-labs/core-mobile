import { Button, Text, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setViewOnce, ViewOnceKey } from 'store/viewOnce'

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

  const renderFooter = useCallback(() => {
    return (
      <View
        sx={{
          gap: 20
        }}>
        <Button size="large" type="primary" onPress={onAcceptAnalytics}>
          Unlock
        </Button>
        <Button size="large" type="tertiary" onPress={onRejectAnalytics}>
          No thanks
        </Button>
      </View>
    )
  }, [onAcceptAnalytics, onRejectAnalytics])

  return (
    <ScrollScreen
      title="Unlock airdrops"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ gap: 20 }}>
        <Text testID="anlaysticsContent" variant="subtitle1">
          As a Core user, you have the option to opt-in for{' '}
          <Text variant="body1" sx={{ fontWeight: '700' }}>
            airdrop rewards
          </Text>{' '}
          based on your activity and engagement. Core will collect anonymous
          interaction data to power this feature.
        </Text>
        <Text testID="anlaysticsContent" variant="subtitle1">
          Core is committed to protecting your privacy. We will never sell or
          share your data. If you wish, you can disable this at any time in the
          settings menu.
        </Text>
      </View>
    </ScrollScreen>
  )
}
