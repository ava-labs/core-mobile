import React from 'react'
import {
  View,
  Text,
  Button,
  Card,
  Icons,
  useTheme,
  Separator,
  TouchableOpacity,
  ActivityIndicator
} from '@avalabs/k2-alpine'

export const AuthenticatorSetup = ({
  totpKey,
  onScanQrCode,
  onCopyCode,
  onVerifyCode
}: {
  totpKey: string
  onScanQrCode: () => void
  onCopyCode: () => void
  onVerifyCode: () => void
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      sx={{
        flex: 1,
        paddingTop: 25,
        paddingHorizontal: 16,
        justifyContent: 'space-between'
      }}>
      <View>
        <Text variant="heading2" sx={{ marginRight: 37 }}>
          Authenticator setup
        </Text>
        <Text variant="body1" sx={{ marginTop: 8, marginRight: 8 }}>
          Open any authenticator app and use it to enter the code found below
        </Text>
        <Card sx={{ paddingRight: 0, marginTop: 34 }}>
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
      </View>
      <View sx={{ marginBottom: 36 }}>
        <Button type="primary" size="large" onPress={onVerifyCode}>
          Next
        </Button>
      </View>
    </View>
  )
}
