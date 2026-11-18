import React, { useCallback, useRef } from 'react'
import { Icons, Text, useTheme, Button, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { showSnackbar } from 'new/common/utils/toast'
import { copySecretToClipboard } from 'common/utils/clipboard'
import { ScreenshotWarning } from 'common/components/ScreenshotWarning'
import { useSecureScreen } from 'hooks/useSecureScreen'
import { sensitiveDataStore } from 'utils/sensitiveDataStore'

const ViewPrivateKeyScreen = (): JSX.Element => {
  useSecureScreen()
  // Read once on mount so the private key is never stored in route state
  const privateKeyRef = useRef(sensitiveDataStore.getPrivateKey() ?? '')
  const privateKey = privateKeyRef.current
  const {
    theme: { colors }
  } = useTheme()

  const handleCopyKey = useCallback(async (): Promise<void> => {
    try {
      copySecretToClipboard(
        privateKey,
        'Private key copied. Clipboard will be cleared in 60 seconds'
      )
    } catch (error) {
      showSnackbar('Failed to copy private key')
    }
  }, [privateKey])

  return (
    <ScrollScreen
      title="Here's the private key for this account"
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View sx={{ gap: 24, marginBottom: 24 }}>
        <Text
          variant="body1"
          sx={{
            color: colors.$textSecondary,
            fontSize: 16
          }}>
          This key gives access to your account's addresses. Keep it secure.
        </Text>

        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 3,
            borderRadius: 2,
            gap: 8
          }}>
          <Icons.Alert.ErrorOutline
            color={colors.$textDanger}
            width={24}
            height={24}
          />
          <Text
            variant="body2"
            sx={{
              color: colors.$textDanger,
              marginLeft: 2,
              fontSize: 14
            }}>
            Anyone with this private key can access the account(s) associated
            with it
          </Text>
        </View>

        <ScreenshotWarning secretLabel="private key" />

        <View
          sx={{
            padding: 16,
            backgroundColor: colors.$surfaceSecondary,
            borderRadius: 2,
            height: 120
          }}>
          <Text
            testID="private_key"
            variant="mono"
            selectable
            sx={{
              color: colors.$textPrimary,
              fontSize: 16
            }}>
            {privateKey}
          </Text>
        </View>
      </View>

      <View sx={{ alignItems: 'center' }}>
        <Button
          style={{ width: 120 }}
          onPress={handleCopyKey}
          type="secondary"
          size="large">
          Copy key
        </Button>
      </View>
    </ScrollScreen>
  )
}

export default ViewPrivateKeyScreen
