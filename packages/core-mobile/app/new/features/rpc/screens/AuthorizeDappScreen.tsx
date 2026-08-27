import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { useSelector } from 'react-redux'
import { selectAccounts, selectActiveAccount } from 'store/account/slice'
import { showSnackbar } from 'new/common/utils/toast'
import { router } from 'expo-router'
import { SCREEN_WIDTH, Text, Icons, useTheme } from '@avalabs/k2-alpine'
import { SessionProposalParams } from 'services/walletconnectv2/walletConnectCache/types'
import { ActionSheet } from 'new/common/components/ActionSheet'
import {
  assessDappTrust,
  DappTrustLevel,
  isVerifiedCoreDomain
} from 'store/rpc/handlers/wc_sessionRequest/utils'
import { AlertType } from '@avalabs/vm-module-types'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { DappLogo } from 'common/components/DappLogo'
import { Account } from 'store/account'
import { SelectAccounts } from '../components/SelectAccounts'

const showNoActiveAccountMessage = (): void => {
  showSnackbar('There is no active account.')
}

const AuthorizeDappScreen = ({
  params: { request, namespaces, scanResponse, scanFailed }
}: {
  params: SessionProposalParams
}): JSX.Element => {
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()
  const { theme } = useTheme()
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

  const trust = assessDappTrust({
    verifyContext: request.data.verifyContext,
    metadataUrl: peerMeta.url,
    scanResponse,
    scanFailed
  })
  const hasDisplayUrl = trust.displayUrl.trim().length > 0
  // Only render the first-party Core logo when WC Verify has actually attested
  // a Core domain — never off the spoofable peerMeta.name.
  const isVerifiedCore = isVerifiedCoreDomain(request.data.verifyContext)

  // Every non-TRUSTED verdict carries at least one reason — assessDappTrust
  // returns an empty list only for TRUSTED — so narrowing on the first reason
  // never suppresses an alert that would otherwise be shown.
  const primaryReason = trust.reasons[0]

  const alert = !primaryReason
    ? undefined
    : trust.level === DappTrustLevel.MALICIOUS
    ? {
        type: AlertType.DANGER,
        message: `${primaryReason} I understand the risk.`
      }
    : trust.level === DappTrustLevel.SUSPICIOUS
    ? {
        type: AlertType.DANGER,
        message: `${primaryReason} Connect only if you trust it.`
      }
    : trust.level === DappTrustLevel.UNVERIFIED
    ? {
        type: AlertType.WARNING,
        message: primaryReason
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
          <DappLogo peerMeta={peerMeta} trusted={isVerifiedCore} />
          <View style={styles.domainUrlContainer}>
            <Text
              variant="heading6"
              style={{
                textAlign: 'center',
                width: SCREEN_WIDTH * 0.7,
                marginBottom: 12
              }}
              numberOfLines={2}>
              {peerMeta.name}
            </Text>
            {hasDisplayUrl && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginBottom: trust.originAttested ? 16 : 6,
                  maxWidth: SCREEN_WIDTH * 0.85
                }}>
                {trust.originAttested ? (
                  // VALID: WC Verify attested this origin.
                  <Icons.Action.CheckCircle
                    color={theme.colors.$textSuccess}
                    width={18}
                    height={18}
                  />
                ) : (
                  // Not VALID-attested: the URL is self-reported.
                  <Icons.Action.Info
                    color={theme.colors.$textSecondary}
                    width={18}
                    height={18}
                  />
                )}
                <Text
                  variant="body1"
                  style={{ fontFamily: 'Inter-SemiBold' }}
                  sx={{
                    color: trust.originAttested
                      ? '$textPrimary'
                      : '$textSecondary'
                  }}
                  numberOfLines={1}>
                  {trust.displayUrl}
                </Text>
              </View>
            )}
            {!trust.originAttested && (
              // The URL above is shown but NOT trusted — make clear it is
              // self-reported and could be impersonating another site.
              <Text
                variant="caption"
                sx={{ color: '$textSecondary' }}
                style={{
                  textAlign: 'center',
                  width: SCREEN_WIDTH * 0.85,
                  marginBottom: 16
                }}>
                {
                  'This domain is self-reported and could not be verified — it may be impersonating another site.'
                }
              </Text>
            )}
            <Text
              variant="body1"
              style={{ textAlign: 'center', width: SCREEN_WIDTH * 0.85 }}>
              {
                'This dApp wants to connect. This will allow it to view your wallet address and balance, and request approval for transactions and message signatures.'
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

export default withWalletConnectCache('sessionProposalParams')(
  AuthorizeDappScreen
)
