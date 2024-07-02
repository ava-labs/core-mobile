import React, { useEffect } from 'react'
import { Space } from 'components/Space'
import { useDispatch } from 'react-redux'
import {
  Button,
  Icons,
  ScrollView,
  Text,
  View,
  useTheme
} from '@avalabs/k2-mobile'
import { ViewOnceKey, setViewOnce } from 'store/viewOnce'
import { useAnalyticsConsent } from 'hooks/useAnalyticsConsent'

type Props = {
  title?: string
  onDone: () => void
}

const AnalyticsConsent = ({ title, onDone }: Props): JSX.Element => {
  const dispatch = useDispatch()
  const { accept, reject } = useAnalyticsConsent()
  const {
    theme: { colors }
  } = useTheme()

  function acceptAnalytics(): void {
    accept()
    onDone()
  }

  function rejectAnalytics(): void {
    reject()
    onDone()
  }

  useEffect(() => {
    return () => {
      dispatch(setViewOnce(ViewOnceKey.ANALYTICS_CONSENT))
    }
  }, [dispatch])

  return (
    <>
      <ScrollView
        sx={{ zIndex: 100 }}
        contentContainerStyle={{
          minHeight: '100%',
          paddingHorizontal: 16,
          paddingBottom: 32
        }}>
        {(title ?? '').length > 0 && (
          <>
            <Text variant="heading3">{title}</Text>
          </>
        )}
        <Space y={24} />
        <Text variant="body1">
          As a Core user, you have the option to opt-in for{' '}
          <Text variant="body1" sx={{ fontWeight: '700' }}>
            airdrop rewards
          </Text>{' '}
          based on your activity and engagement. Core will collect anonymous
          interaction data to power this feature.
        </Text>
        <Space y={16} />
        <Text variant="body1">
          Core is committed to protecting your privacy. We will{' '}
          <Text variant="body1" sx={{ fontWeight: '700' }}>
            never
          </Text>{' '}
          sell or share your data. If you wish, you can disable this at any time
          in the settings menu.
        </Text>
      </ScrollView>
      <View sx={{ padding: 16 }}>
        <View sx={{ position: 'absolute', top: -250, right: -95 }}>
          <Icons.Custom.Airdrop
            width={320}
            height={320}
            color={colors.$neutral800}
          />
        </View>
        <Button
          size="xlarge"
          type="primary"
          onPress={acceptAnalytics}
          testID="iAgreeBtn">
          Unlock
        </Button>
        <Space y={16} />
        <Button
          size="xlarge"
          type="secondary"
          onPress={rejectAnalytics}
          testID="noThanksBtn">
          No Thanks
        </Button>
      </View>
    </>
  )
}

export default AnalyticsConsent
