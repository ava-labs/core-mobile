import { Text } from '@avalabs/k2-alpine'
import React, { ReactNode, useCallback } from 'react'
import { View } from 'react-native'
import { SetDeveloperModeParams } from 'services/walletconnectv2/walletConnectCache/types'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { ActionSheet } from 'common/components/ActionSheet'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { router } from 'expo-router'
import { DappLogo } from 'common/components/DappLogo'

const ToggleDeveloperModeScreen = ({
  params: { request, data }
}: {
  params: SetDeveloperModeParams
}): ReactNode => {
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()

  const rejectAndClose = useCallback(() => {
    onReject(request)
    router.canGoBack() && router.back()
  }, [onReject, request])

  const approve = useCallback((): void => {
    onApprove(request, data)
    router.canGoBack() && router.back()
  }, [onApprove, request, data])

  const enabledDeveloperMode = data.enabled

  const title = `Do you want to ${
    enabledDeveloperMode ? 'enable' : 'disable'
  } testnet mode?`

  const renderDappInfo = useCallback((): JSX.Element | null => {
    const action =
      request.peerMeta.name +
      ` is requesting to ${
        enabledDeveloperMode ? 'enable' : 'disable'
      } testnet mode`

    return (
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 36
        }}>
        <DappLogo peerMeta={request.peerMeta} />
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 21
          }}>
          <Text
            variant="body1"
            sx={{
              textAlign: 'center',
              fontSize: 15,
              lineHeight: 20,
              fontWeight: '500',
              color: '$textPrimary'
            }}>
            {action}
          </Text>
        </View>
      </View>
    )
  }, [enabledDeveloperMode, request.peerMeta])

  return (
    <ActionSheet
      isModal
      title={title}
      navigationTitle={title}
      onClose={() => onReject(request)}
      confirm={{
        label: 'Approve',
        onPress: approve
      }}
      cancel={{
        label: 'Reject',
        onPress: rejectAndClose
      }}>
      {renderDappInfo()}
    </ActionSheet>
  )
}

export default withWalletConnectCache('setDeveloperModeParams')(
  ToggleDeveloperModeScreen
)
