import { GroupList, GroupListItem, Text } from '@avalabs/k2-alpine'
import React, { ReactNode, useCallback } from 'react'
import { Pressable, View } from 'react-native'
import { EditContactParams } from 'services/walletconnectv2/walletConnectCache/types'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { ActionSheet } from 'common/components/ActionSheet'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { router } from 'expo-router'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { copyToClipboard } from 'common/utils/clipboard'
import { DappLogo } from 'common/components/DappLogo'

const EditContactScreen = ({
  params: { request, contact, action }
}: {
  params: EditContactParams
}): ReactNode => {
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()

  const rejectAndClose = useCallback(() => {
    onReject(request)
    router.canGoBack() && router.back()
  }, [onReject, request])

  const approve = useCallback((): void => {
    onApprove(request, { contact })
    router.canGoBack() && router.back()
  }, [onApprove, request, contact])

  const title = `Do you want to ${action} contact?`

  const renderDappInfo = useCallback((): JSX.Element | null => {
    const description =
      request.peerMeta.name + ` is requesting to ${action} this contact`

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
  }, [action, request.peerMeta])

  const renderAddress = useCallback((address: string): JSX.Element => {
    return (
      <Pressable
        onPress={() => {
          copyToClipboard(address, 'Address copied')
        }}>
        <Text
          variant="mono"
          numberOfLines={1}
          sx={{
            fontSize: 15,
            color: '$textSecondary'
          }}>
          {truncateAddress(address, 8)}
        </Text>
      </Pressable>
    )
  }, [])

  const renderContent = useCallback((): JSX.Element | null => {
    const data: GroupListItem[] = [
      {
        title: 'Name',
        value: contact.name
      }
    ]

    contact.address &&
      data.push({
        title: 'Avalanche C-Chain/EVM',
        value: renderAddress(contact.address)
      })

    contact.addressXP &&
      data.push({
        title: 'Avalanche X/P-Chain',
        value: renderAddress(contact.addressXP)
      })

    contact.addressBTC &&
      data.push({
        title: 'Bitcoin',
        value: renderAddress(contact.addressBTC)
      })

    contact.addressSVM &&
      data.push({
        title: 'Solana',
        value: renderAddress(contact.addressSVM)
      })

    return (
      <GroupList
        data={data}
        titleSx={{
          fontSize: 15,
          color: '$textPrimary'
        }}
      />
    )
  }, [contact, renderAddress])

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

export default withWalletConnectCache('editContactParams')(EditContactScreen)
