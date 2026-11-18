import { GroupList, GroupListItem, Text } from '@avalabs/k2-alpine'
import React, { ReactNode, useCallback } from 'react'
import { View } from 'react-native'
import { useSelector } from 'react-redux'
import { AlertType } from '@avalabs/vm-module-types'
import { router } from 'expo-router'
import { SwitchEthereumChainParams } from 'services/walletconnectv2/walletConnectCache/types'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { ActionSheet } from 'common/components/ActionSheet'
import { DappLogo } from 'common/components/DappLogo'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { getSwitchChainOrigin } from '../utils/getSwitchChainOrigin'

/**
 * Confirmation shown before an in-app browser dApp switches the tab's chain
 * (`wallet_switchEthereumChain`, or `wallet_addEthereumChain` for a chain Core
 * already knows). Rejecting returns EIP-1193 4001 and leaves the chain as is.
 */
export const SwitchEthereumChainScreen = ({
  params: { request, network }
}: {
  params: SwitchEthereumChainParams
}): ReactNode => {
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const origin = getSwitchChainOrigin(request.peerMeta)
  const isTestnetMismatch = Boolean(network.isTestnet) !== isDeveloperMode

  const rejectAndClose = useCallback(() => {
    onReject(request)
    router.canGoBack() && router.back()
  }, [onReject, request])

  const approve = useCallback((): void => {
    onApprove(request)
    router.canGoBack() && router.back()
  }, [onApprove, request])

  const data: GroupListItem[] = [
    { title: 'Website', subtitle: origin },
    { title: 'Network', subtitle: network.chainName },
    { title: 'Chain ID', subtitle: network.chainId.toString() },
    {
      title: 'Network type',
      subtitle: network.isTestnet ? 'Testnet' : 'Mainnet'
    }
  ]

  return (
    <ActionSheet
      isModal
      onClose={() => onReject(request)}
      alert={
        isTestnetMismatch
          ? {
              type: AlertType.WARNING,
              message: network.isTestnet
                ? 'This dApp is asking to switch to a testnet. Testnet tokens have no value.'
                : 'This dApp is asking to switch to a mainnet. Transactions will use real funds.'
            }
          : undefined
      }
      confirm={{
        label: 'Switch network',
        onPress: approve,
        testID: 'switch_chain_approve_button'
      }}
      cancel={{
        label: 'Reject',
        onPress: rejectAndClose,
        testID: 'switch_chain_reject_button'
      }}>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 36
        }}>
        <DappLogo peerMeta={request.peerMeta} />
        <Text
          testID="switch_chain_description"
          variant="body1"
          sx={{
            marginTop: 21,
            textAlign: 'center',
            fontSize: 15,
            lineHeight: 20,
            fontFamily: 'Inter-Medium',
            color: '$textPrimary'
          }}>
          {`${origin} wants to switch the network to ${network.chainName}`}
        </Text>
      </View>
      <GroupList
        data={data}
        titleSx={{ fontSize: 15, color: '$textPrimary' }}
        subtitleSx={{
          fontSize: 15,
          fontFamily: 'Inter-Regular',
          marginTop: 4,
          color: '$textSecondary'
        }}
      />
    </ActionSheet>
  )
}

export default withWalletConnectCache('switchEthereumChainParams')(
  SwitchEthereumChainScreen
)
