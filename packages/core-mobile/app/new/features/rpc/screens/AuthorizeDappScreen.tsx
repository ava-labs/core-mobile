import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { useSelector } from 'react-redux'
import { selectAccounts, selectActiveAccount } from 'store/account/slice'
import { showSnackbar } from 'new/common/utils/toast'
import { router } from 'expo-router'
import { SCREEN_WIDTH, Text } from '@avalabs/k2-alpine'
import { SessionProposalParams } from 'services/walletconnectv2/walletConnectCache/types'
import { ActionSheet } from 'new/common/components/ActionSheet'
import { isSiteScanResponseMalicious } from 'store/rpc/handlers/wc_sessionRequest/utils'
import { AlertType } from '@avalabs/vm-module-types'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { DappLogo } from 'common/components/DappLogo'
import { Account } from 'store/account'
import { SelectAccounts } from '../components/SelectAccounts'

const showNoActiveAccountMessage = (): void => {
  showSnackbar('There is no active account.')
}

const AuthorizeDappScreen = ({
  params: { request, namespaces, scanResponse }
}: {
  params: SessionProposalParams
}): JSX.Element => {
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()
  const activeAccount = useSelector(selectActiveAccount)
  const allAccounts = useSelector(selectAccounts)
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([])
  const peerMeta = request.data.params.proposer.metadata
  const approveDisabled = selectedAccounts.length === 0

  const rejectAndClose = useCallback(() => {
    onReject(request)
    router.canGoBack() && router.back()
  }, [onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { selectedAccounts, namespaces })
    router.canGoBack() && router.back()
  }, [onApprove, request, selectedAccounts, namespaces])

  useEffect(() => {
    if (!activeAccount) {
      showNoActiveAccountMessage()
      rejectAndClose()
    }
  }, [activeAccount, request, rejectAndClose])

  const onSelect = useCallback(
    (account: Account): void => {
      if (!selectedAccounts.find(item => item.addressC === account.addressC))
        setSelectedAccounts(current => [...current, account])
      else
        setSelectedAccounts(current =>
          current.filter(item => item.addressC !== account.addressC)
        )
    },
    [selectedAccounts]
  )

  const isMaliciousDapp =
    scanResponse && isSiteScanResponseMalicious(scanResponse)

  const alert = isMaliciousDapp
    ? {
        type: AlertType.DANGER,
        message:
          'This application has been flagged as malicious, I understand the risk.'
      }
    : undefined

  return (
    <ActionSheet
      isModal
      navigationTitle="Connect wallet?"
      onClose={() => onReject(request)}
      alert={alert}
      confirm={{
        label: 'Connect',
        onPress: approveAndClose,
        disabled: approveDisabled
      }}
      cancel={{
        label: 'Cancel',
        onPress: rejectAndClose
      }}>
      <>
        <View style={styles.iconContainer}>
          <DappLogo peerMeta={peerMeta} />
          <View style={styles.domainUrlContainer}>
            <Text
              variant="heading6"
              style={{
                textAlign: 'center',
                width: SCREEN_WIDTH * 0.7,
                marginBottom: 24
              }}
              numberOfLines={2}>
              {peerMeta.name}
            </Text>
            <Text
              variant="body1"
              style={{ textAlign: 'center', width: SCREEN_WIDTH * 0.85 }}>
              Do you want to allow{' '}
              <Text variant="body1" style={{ fontWeight: '600' }}>
                {peerMeta.url}
              </Text>{' '}
              to access your wallet? Tapping “Connect” will grant full access to
              the accounts selected
            </Text>
          </View>
        </View>
        <SelectAccounts
          onSelect={onSelect}
          selectedAccounts={selectedAccounts}
          accounts={allAccounts}
        />
      </>
    </ActionSheet>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  domainUrlContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 48,
    marginHorizontal: 20
  }
})

export default withWalletConnectCache('sessionProposalParams')(
  AuthorizeDappScreen
)
