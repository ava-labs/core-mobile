import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { selectAccounts, selectActiveAccount } from 'store/account/slice'
import { showSnackbar } from 'new/common/utils/toast'
import { router, useLocalSearchParams } from 'expo-router'
import { SCREEN_WIDTH, Text } from '@avalabs/k2-alpine'
import { ActionSheet } from 'new/common/components/ActionSheet'
import { DappLogo } from 'common/components/DappLogo'
import { Account } from 'store/account'
import { SelectAccounts } from 'features/rpc/components/SelectAccounts'
import { connectApprovalRegistry } from 'hooks/browser/injectedProvider/connectApprovalRegistry'
import { applyConnectNavEffect } from 'hooks/browser/injectedProvider/connectApprovalNavigation'
import {
  EIP1193_USER_REJECTED_CODE,
  USER_REJECTED_REQUEST_MESSAGE
} from 'hooks/browser/injectedProvider/errors'

const showNoActiveAccountMessage = (): void => {
  showSnackbar('There is no active account.')
}

const dismissModal = (): void => {
  if (router.canGoBack()) router.back()
}

const AuthorizeInjectedDappScreen = (): JSX.Element | null => {
  const { approvalId } = useLocalSearchParams<{ approvalId: string }>()
  const activeAccount = useSelector(selectActiveAccount)
  const allAccounts = useSelector(selectAccounts)
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([])
  const approveDisabled = selectedAccounts.length === 0

  // Reset selection when the route param changes — router.replace may reuse this
  // component instance for the next queued approval, which must not inherit the
  // prior dApp's selection / enabled confirm. (CP-14385 review)
  useEffect(() => {
    setSelectedAccounts([])
  }, [approvalId])

  const rejectAndClose = useCallback(() => {
    if (!approvalId) {
      dismissModal()
      return
    }
    const navigated = applyConnectNavEffect(
      connectApprovalRegistry.reject(approvalId, {
        code: EIP1193_USER_REJECTED_CODE,
        message: USER_REJECTED_REQUEST_MESSAGE
      })
    )
    if (!navigated) dismissModal()
  }, [approvalId])

  const approveAndClose = useCallback(() => {
    if (!approvalId) {
      dismissModal()
      return
    }
    const navigated = applyConnectNavEffect(
      connectApprovalRegistry.resolve(approvalId, selectedAccounts)
    )
    if (!navigated) dismissModal()
  }, [approvalId, selectedAccounts])

  // The entry can already be gone by mount time (resolved / rejected / timed out
  // before this screen mounted). Nothing to show → dismiss.
  useEffect(() => {
    if (approvalId && !connectApprovalRegistry.get(approvalId)) {
      dismissModal()
    }
  }, [approvalId])

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

  const entry = approvalId ? connectApprovalRegistry.get(approvalId) : undefined
  if (!entry) return null
  const { peerMeta } = entry

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

export default AuthorizeInjectedDappScreen
