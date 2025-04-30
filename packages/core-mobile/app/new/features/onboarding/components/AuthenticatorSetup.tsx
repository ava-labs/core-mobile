import {
  ActivityIndicator,
  Button,
  Card,
  Icons,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Loader } from 'common/components/Loader'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback } from 'react'

export const AuthenticatorSetup = ({
  totpKey,
  onScanQrCode,
  onCopyCode,
  onVerifyCode,
  isLoading
}: {
  totpKey?: string
  onScanQrCode: () => void
  onCopyCode: () => void
  onVerifyCode: () => void
  isLoading: boolean
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const renderFooter = useCallback(() => {
    return (
      <Button type="primary" size="large" onPress={onVerifyCode}>
        Next
      </Button>
    )
  }, [onVerifyCode])

  return (
    <ScrollScreen
      title="Authenticator setup"
      subtitle="Open any authenticator app and use it to enter the code found below"
      renderFooter={renderFooter}
      contentContainerStyle={{ flex: 1, padding: 16 }}>
      {isLoading ? (
        <Loader />
      ) : (
        <Card
          sx={{
            marginTop: 24
          }}>
          <TouchableOpacity
            onPress={onCopyCode}
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              width: '100%'
            }}>
            <View sx={{ width: 18, marginTop: -16, alignItems: 'center' }}>
              <Icons.RecoveryMethod.Copy color={colors.$textPrimary} />
            </View>
            <View sx={{ flex: 1 }}>
              <View sx={{ gap: 4 }}>
                <Text
                  sx={{
                    fontSize: 16,
                    fontWeight: '500',
                    lineHeight: 16,
                    color: colors.$textPrimary
                  }}>
                  Copy code
                </Text>
                <View sx={{ marginTop: 3, marginRight: 39, marginBottom: 16 }}>
                  {totpKey ? (
                    <Text
                      sx={{
                        fontSize: 12,
                        fontWeight: '400',
                        lineHeight: 15,
                        color: colors.$textSecondary
                      }}>
                      {totpKey}
                    </Text>
                  ) : (
                    <ActivityIndicator
                      size={16}
                      color={colors.$textPrimary}
                      sx={{
                        alignSelf: 'flex-start'
                      }}
                    />
                  )}
                </View>
              </View>
              <Separator />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onScanQrCode}
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              width: '100%',
              marginTop: 16
            }}>
            <View sx={{ width: 18, alignItems: 'center' }}>
              <Icons.RecoveryMethod.QrCode color={colors.$textPrimary} />
            </View>
            <View sx={{ flex: 1 }}>
              <View sx={{ gap: 4 }}>
                <Text
                  sx={{
                    fontSize: 16,
                    fontWeight: '500',
                    lineHeight: 16,
                    color: colors.$textPrimary
                  }}>
                  Scan QR code
                </Text>
                <Text
                  sx={{
                    fontSize: 12,
                    fontWeight: '400',
                    lineHeight: 15,
                    color: colors.$textSecondary,
                    marginTop: 3,
                    marginRight: 39
                  }}>
                  View QR code to scan with your authenticator app
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Card>
      )}
    </ScrollScreen>
  )
}
