import { GroupList, GroupListItem, Text } from '@avalabs/k2-alpine'
import React, { ReactNode, useCallback } from 'react'
import { View } from 'react-native'
import { AddEthereumChainParams } from 'services/walletconnectv2/walletConnectCache/types'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { ActionSheet } from 'common/components/ActionSheet'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { router } from 'expo-router'
import { DappLogo } from 'common/components/DappLogo'

const AddEthereumChainScreen = ({
  params: { request, network }
}: {
  params: AddEthereumChainParams
}): ReactNode => {
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()

  const rejectAndClose = useCallback(() => {
    onReject(request)
    router.canGoBack() && router.back()
  }, [onReject, request])

  const approve = useCallback((): void => {
    onApprove(request, { network })
    router.canGoBack() && router.back()
  }, [onApprove, request, network])

  const title = 'Do you want to add this chain?'

  const renderDappInfo = useCallback((): JSX.Element | null => {
    const description =
      request.peerMeta.name + ` is requesting to add this chain`

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
            {description}
          </Text>
        </View>
      </View>
    )
  }, [request.peerMeta])

  const renderContent = useCallback((): JSX.Element | null => {
    const data: GroupListItem[] = [
      {
        title: 'Network RPC URL',
        subtitle: network.rpcUrl
      },
      {
        title: 'Chain ID',
        subtitle: network.chainId.toString()
      },
      {
        title: 'Token symbol',
        subtitle: network.networkToken.symbol
      },
      {
        title: 'Token name',
        subtitle: network.networkToken.name
      },
      {
        title: 'Explorer URL',
        subtitle: network.explorerUrl
      },
      {
        title: 'Testnet',
        subtitle: String(network.isTestnet)
      }
    ]

    return (
      <GroupList
        data={data}
        titleSx={{
          fontSize: 15,
          color: '$textPrimary'
        }}
        subtitleSx={{
          fontSize: 15,
          fontFamily: 'Inter-Regular',
          marginTop: 4,
          color: '$textSecondary'
        }}
      />
    )
  }, [network])

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
      {renderContent()}
    </ActionSheet>
  )
}

export default withWalletConnectCache('addEthereumChainParams')(
  AddEthereumChainScreen
)
