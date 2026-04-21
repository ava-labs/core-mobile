import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { selectAccounts, selectActiveAccount } from 'store/account/slice'
import { showSnackbar } from 'new/common/utils/toast'
import { router } from 'expo-router'
import { SCREEN_WIDTH, Text } from '@avalabs/k2-alpine'
import { InjectedAuthParams } from 'services/walletconnectv2/walletConnectCache/types'
import { ActionSheet } from 'new/common/components/ActionSheet'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { DappLogo } from 'common/components/DappLogo'
import { Account } from 'store/account'
import { SelectAccounts } from 'features/rpc/components/SelectAccounts'

const showNoActiveAccountMessage = (): void => {
  showSnackbar('There is no active account.')
}

const AuthorizeInjectedDappScreen = ({
  params: { peerMeta, onApprove, onReject }
}: {
  params: InjectedAuthParams
}): JSX.Element => {
  const activeAccount = useSelector(selectActiveAccount)
  const allAccounts = useSelector(selectAccounts)
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([])
  const approveDisabled = selectedAccounts.length === 0

  const rejectAndClose = useCallback(() => {
    onReject()
    router.canGoBack() && router.back()
  }, [onReject])

  const approveAndClose = useCallback(() => {
    onApprove(selectedAccounts)
    router.canGoBack() && router.back()
  }, [onApprove, selectedAccounts])

  useEffect(() => {
    if (!activeAccount) {
      showNoActiveAccountMessage()
      rejectAndClose()
    }
  }, [activeAccount, rejectAndClose])

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

  return (
    <ActionSheet
      isModal
      navigationTitle="Connect wallet?"
      onClose={rejectAndClose}
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
              <Text variant="body1" style={{ fontWeight: '600' }}>
                {peerMeta.url}
              </Text>
              {
                ' wants to connect. This will allow the site to view your wallet address and balance, and request approval for transactions and message signatures.'
              }
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

export default withWalletConnectCache('injectedAuthParams')(
  AuthorizeInjectedDappScreen
)
