import AvaText from 'components/AvaText'
import React, { useCallback, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import Avatar from 'components/Avatar'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import { showSimpleToast } from 'components/Snackbar'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { useSelector } from 'react-redux'
import { selectAccounts, selectActiveAccount } from 'store/account'
import { Button, Text } from '@avalabs/k2-mobile'
import { isSiteScanResponseMalicious } from 'store/rpc/handlers/wc_sessionRequest/utils'
import { AlertType } from '@avalabs/vm-module-types'
import { CorePrimaryAccount } from '@avalabs/types'
import { CoreTypes } from '@walletconnect/types'
import RpcRequestBottomSheet from '../../shared/RpcRequestBottomSheet'
import AlertBanner from '../AlertBanner'
import SelectAccounts from './SelectAccounts'
import Networks from './Networks'

const showNoActiveAccountMessage = (): void => {
  showSimpleToast('There is no active account.')
}

type SessionProposalScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.SessionProposalV2
>

const SessionProposal = (): JSX.Element => {
  const { goBack } = useNavigation<SessionProposalScreenProps['navigation']>()
  const { request, namespaces, scanResponse } =
    useRoute<SessionProposalScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()

  const theme = useApplicationContext().theme
  const activeAccount = useSelector(selectActiveAccount)
  const allAccounts = useSelector(selectAccounts)
  const [selectedAccounts, setSelectedAccounts] = useState<
    CorePrimaryAccount[]
  >([])
  const peerMeta = request.data.params.proposer.metadata
  const siteName = peerMeta.name
  const approveDisabled = selectedAccounts.length === 0
  const chainIds = Object.values(namespaces)
    .flatMap(namespace => namespace.chains ?? [])
    .map(chain => Number(chain.split(':')[1]))

  useEffect(() => {
    if (!activeAccount) {
      showNoActiveAccountMessage()
      onReject(request)
    }
  }, [activeAccount, request, onReject])

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { selectedAccounts, namespaces })
    goBack()
  }, [goBack, onApprove, request, selectedAccounts, namespaces])

  const onSelect = (account: CorePrimaryAccount): void => {
    if (!selectedAccounts.find(item => item.addressC === account.addressC))
      setSelectedAccounts(current => [...current, account])
    else
      setSelectedAccounts(current =>
        current.filter(item => item.addressC !== account.addressC)
      )
  }

  const renderNetworks = (): React.JSX.Element => {
    const hasMore = chainIds.length > 6
    const chainIdsToDisplay = hasMore ? chainIds.slice(0, 6) : chainIds
    return <Networks chainIds={chainIdsToDisplay} hasMore={hasMore} />
  }

  const getPngFromMetadata = (
    metadata: CoreTypes.Metadata
  ): string | undefined => {
    return metadata.icons.find(
      icon => icon.endsWith('.png') || icon.endsWith('.ico')
    )
  }

  return (
    <RpcRequestBottomSheet onClose={rejectAndClose}>
      <NativeViewGestureHandler>
        <ScrollView contentContainerStyle={styles.container}>
          <Text variant="heading4">Connect Wallet?</Text>
          <Space y={8} />
          {scanResponse && isSiteScanResponseMalicious(scanResponse) && (
            <>
              <Space y={32} />
              <AlertBanner
                alert={{
                  type: AlertType.DANGER,
                  details: {
                    title: 'Scam Application',
                    description:
                      'This application is malicious, do not proceed.'
                  }
                }}
              />
            </>
          )}
          <Space y={48} />
          <View style={styles.iconContainer}>
            <OvalTagBg
              style={{
                height: 80,
                width: 80,
                backgroundColor: theme.colorBg3
              }}>
              <Avatar.Custom
                name={peerMeta.name}
                logoUri={getPngFromMetadata(peerMeta)}
                size={80}
              />
            </OvalTagBg>
            <View style={styles.domainUrlContainer}>
              <AvaText.Heading2 textStyle={{ textAlign: 'center' }}>
                {siteName}
              </AvaText.Heading2>
              <Space y={6} />
              <AvaText.Body3 color={theme.colorText1}>
                {peerMeta?.url}
              </AvaText.Body3>
            </View>
            <Space y={16} />
          </View>
          <Space y={16} />
          {renderNetworks()}
          <Space y={16} />
          <SelectAccounts
            onSelect={onSelect}
            selectedAccounts={selectedAccounts}
            accounts={allAccounts}
          />
          <Space y={24} />
          <FlexSpacer />
          <AvaText.Body2 textStyle={{ textAlign: 'center' }}>
            Only connect to sites that you trust
          </AvaText.Body2>
          <View style={styles.actionContainer}>
            <Button
              type="primary"
              size="xlarge"
              onPress={approveAndClose}
              disabled={approveDisabled}>
              Approve
            </Button>
            <Space y={16} />
            <Button type="secondary" size="xlarge" onPress={rejectAndClose}>
              Reject
            </Button>
            <Space y={16} />
          </View>
        </ScrollView>
      </NativeViewGestureHandler>
    </RpcRequestBottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    minHeight: '100%',
    paddingHorizontal: 16
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionContainer: {
    flex: 0,
    paddingVertical: 16
  },
  domainUrlContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12
  }
})

export default SessionProposal
