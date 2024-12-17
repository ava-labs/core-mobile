import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'
import React from 'react'
import { View, Text, Button, useTheme, Card, Icons } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { useTotpContext } from 'new/contexts/TotpProvider'

export default function CopyCode(): JSX.Element {
  const { totpKey } = useTotpContext()
  const { handleCopyCode } = useTotpContext()
  const { canGoBack, back } = useRouter()
  const {
    theme: { colors }
  } = useTheme()

  const handleBack = (): void => {
    canGoBack() && back()
  }

  return (
    <BlurredBarsContentLayout>
      <View
        sx={{
          flex: 1,
          paddingTop: 25,
          paddingHorizontal: 16,
          justifyContent: 'space-between'
        }}>
        <View>
          <Text variant="heading2">Copy code</Text>
          <Text variant="body1" sx={{ marginTop: 8 }}>
            Open any authenticator app and use it to enter the code below
          </Text>
          <Card
            sx={{
              marginTop: 34,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 34
            }}>
            <View sx={{ flex: 1 }}>
              <Text
                sx={{
                  fontSize: 14,
                  fontWeight: '500',
                  lineHeight: 17,
                  color: colors.$textPrimary
                }}>
                {totpKey}
              </Text>
            </View>

            <Button type="secondary" size="small" onPress={handleCopyCode}>
              copy
            </Button>
          </Card>

          <View
            sx={{
              flexDirection: 'row',
              gap: 14,
              marginTop: 43,
              marginRight: 20
            }}>
            <Icons.Logos.GoogleAuthenticator />
            <View sx={{ flex: 1, justifyContent: 'center' }}>
              <Text
                sx={{
                  fontSize: 13,
                  fontWeight: '400',
                  lineHeight: 16,
                  color: colors.$textPrimary
                }}>
                If you are using Google Authenticator, be sure that Time based
                is selected
              </Text>
            </View>
          </View>

          <View
            sx={{
              flexDirection: 'row',
              gap: 14,
              marginTop: 20,
              marginRight: 20,
              alignItems: 'center'
            }}>
            <Icons.Logos.MicrosoftAuthenticator />
            <View sx={{ flex: 1, justifyContent: 'center' }}>
              <Text
                sx={{
                  fontSize: 13,
                  fontWeight: '400',
                  lineHeight: 16,
                  color: colors.$textPrimary
                }}>
                If you are using Microsoft Authenticator, tap Add Account
              </Text>
            </View>
          </View>

          <View
            sx={{
              flexDirection: 'row',
              gap: 14,
              marginTop: 20,
              marginRight: 20
            }}>
            <Icons.Logos.AuthenticatorApp />
            <View sx={{ flex: 1, justifyContent: 'center' }}>
              <Text
                sx={{
                  fontSize: 13,
                  fontWeight: '400',
                  lineHeight: 16,
                  color: colors.$textPrimary
                }}>
                If you are using Authenticator App, click the + to add account.
              </Text>
            </View>
          </View>
        </View>
        <View sx={{ gap: 16, marginBottom: 36 }}>
          <Button type="primary" size="large" onPress={handleBack}>
            Back
          </Button>
        </View>
      </View>
    </BlurredBarsContentLayout>
  )
}
