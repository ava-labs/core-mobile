import React, { useCallback } from 'react'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { Text, View } from '@avalabs/k2-mobile'
import DeveloperModeSVG from 'assets/icons/developer_mode.svg'
import FlexSpacer from 'components/FlexSpacer'
import AvaButton from 'components/AvaButton'
import { Space } from 'components/Space'
import { Sheet } from 'components/Sheet'

type AvalancheSetDeveloperModeScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.AvalancheSetDeveloperMode
>

export const AvalancheSetDeveloperMode = (): JSX.Element => {
  const { goBack } =
    useNavigation<AvalancheSetDeveloperModeScreenProps['navigation']>()
  const { request, data } =
    useRoute<AvalancheSetDeveloperModeScreenProps['route']>().params
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()

  const enabledDeveloperMode = data.enabled
  const peerMeta = request.peerMeta
  const OnOrOffText = enabledDeveloperMode ? 'ON' : 'OFF'

  const description =
    new URL(peerMeta?.url ?? '').hostname +
    ` is requesting to turn Testnet Mode ${OnOrOffText}`

  const title = `Turn Testnet Mode ${OnOrOffText}?`

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const onHandleApprove = (): void => {
    onApprove(request, data)
    goBack()
  }

  const renderIcon = (): JSX.Element => {
    return (
      <View
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '$neutral850',
          marginTop: 120
        }}>
        <DeveloperModeSVG />
      </View>
    )
  }
  const renderApproveRejectButtons = (): JSX.Element => {
    return (
      <>
        <FlexSpacer />
        <View style={{ flex: 0, paddingVertical: 40, paddingHorizontal: 14 }}>
          <AvaButton.PrimaryLarge onPress={onHandleApprove}>
            Approve
          </AvaButton.PrimaryLarge>
          <Space y={16} />
          <AvaButton.SecondaryLarge onPress={rejectAndClose}>
            Reject
          </AvaButton.SecondaryLarge>
        </View>
      </>
    )
  }

  const renderContent = (): JSX.Element => {
    return (
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Text variant="buttonLarge">{title}</Text>
        <Text variant="caption" sx={{ color: '$neutral400', marginTop: 4 }}>
          {description}
        </Text>
      </View>
    )
  }

  return (
    <Sheet onClose={rejectAndClose} title="Approve Action">
      <View sx={{ flex: 1 }}>
        <View style={{ alignItems: 'center' }}>
          {renderIcon()}
          {renderContent()}
        </View>
        {renderApproveRejectButtons()}
      </View>
    </Sheet>
  )
}
