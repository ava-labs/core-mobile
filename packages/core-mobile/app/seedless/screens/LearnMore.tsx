import { Button, Text, View } from '@avalabs/k2-mobile'
import React, { useEffect, useState } from 'react'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Space } from 'components/Space'
import { copyToClipboard } from 'utils/DeviceTools'
import Logger from 'utils/Logger'
import SeedlessService from 'seedless/services/SeedlessService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import ContentCopy from '../assets/ContentCopy.svg'
import { Card } from '../components/Card'
import { SnackBarMessage } from '../components/SnackBarMessage'

type LearnMoreScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.LearnMore
>

export const LearnMore = (): JSX.Element => {
  const { totpCode } = useRoute<LearnMoreScreenProps['route']>().params
  const [code, setCode] = useState<string>()
  const { canGoBack, goBack } =
    useNavigation<LearnMoreScreenProps['navigation']>()

  const onGoBack = (): void => {
    if (canGoBack()) {
      goBack()
    }
  }

  const copyCode = (): void => {
    copyToClipboard(code, <SnackBarMessage message="Key Copied" />)
  }

  useEffect(() => {
    const init = async (): Promise<void> => {
      if (totpCode) {
        setCode(totpCode)
        return
      }
      const result = await SeedlessService.sessionManager.setTotp()
      if (result.success && result.value) {
        const newCode = new URL(result.value).searchParams.get('secret')
        newCode && setCode(newCode)
      }
    }
    init().catch(reason => {
      Logger.error('LearnMore AuthenticatorService.setTotp error', reason)

      AnalyticsService.capture('SeedlessRegisterTOTPStartFailed')
    })
  }, [totpCode])

  return (
    <View
      sx={{ marginHorizontal: 16, flex: 1, justifyContent: 'space-between' }}>
      <View>
        <Text variant="heading3">Learn More</Text>
        <View sx={{ marginVertical: 8 }}>
          <Text variant="body1" sx={{ color: '$neutral50' }}>
            Open any <Text variant="heading6">authenticator app</Text> and use
            it to enter the code found below.
          </Text>
        </View>

        {code && (
          <Card
            onPress={copyCode}
            icon={<ContentCopy />}
            title="Copy Code"
            body={code}
            bodyVariant="buttonLarge"
          />
        )}

        <View sx={{ marginVertical: 8 }}>
          <Text variant="body1" sx={{ color: '$neutral50' }}>
            If using Google Authenticator, make sure that
            <Text variant="heading6"> Time based</Text> is selected.
          </Text>
          <Space y={16} />
          <Text variant="body1" sx={{ color: '$neutral50' }}>
            If using Microsoft Authenticator, click
            <Text variant="heading6"> Add Account</Text>.
          </Text>
          <Space y={16} />
          <Text variant="body1" sx={{ color: '$neutral50' }}>
            If using Authenticator App, click the
            <Text variant="heading6"> + to add account</Text>.
          </Text>
        </View>
      </View>

      <Button
        type="primary"
        size="xlarge"
        style={{ marginVertical: 16 }}
        onPress={onGoBack}>
        Back
      </Button>
    </View>
  )
}
