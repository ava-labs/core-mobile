import { Button, Text, View } from '@avalabs/k2-mobile'
import React from 'react'
import { Space } from 'components/Space'
import { copyToClipboard } from 'utils/DeviceTools'
import ContentCopy from '../assets/ContentCopy.svg'
import { Card } from './Card'
import { SnackBarMessage } from './SnackBarMessage'

export const LearnMore = ({
  totpKey,
  onGoBack
}: {
  totpKey: string
  onGoBack: () => void
}): JSX.Element => {
  const copyCode = (): void => {
    copyToClipboard(totpKey, <SnackBarMessage message="Key Copied" />)
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

        {totpKey && (
          <Card
            onPress={copyCode}
            icon={<ContentCopy />}
            title="Copy Code"
            body={totpKey}
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
