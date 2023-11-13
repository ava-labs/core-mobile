import { Button, Text, View } from '@avalabs/k2-mobile'
import React from 'react'
import ContentCopy from 'assets/icons/ContentCopy.svg'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { Space } from 'components/Space'
import { copyToClipboard } from 'utils/DeviceTools'
import { Card } from '../components'
import { SnackBarMessage } from '../components/SnackBarMessage'

type LearnMoreScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.LearnMore
>

export const LearnMore = (): JSX.Element => {
  const { canGoBack, goBack } =
    useNavigation<LearnMoreScreenProps['navigation']>()

  const onGoBack = (): void => {
    if (canGoBack()) {
      goBack()
    }
  }

  const copyCode = (): void => {
    copyToClipboard('TO_BE_IMPLEMENTED', <SnackBarMessage />)
  }

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

        <Card
          onPress={copyCode}
          icon={<ContentCopy />}
          title="Copy Code"
          body="TO_BE_IMPLEMENTED"
          bodyVariant="buttonLarge"
        />

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
        size="large"
        style={{ marginVertical: 16 }}
        onPress={onGoBack}>
        Back
      </Button>
    </View>
  )
}
