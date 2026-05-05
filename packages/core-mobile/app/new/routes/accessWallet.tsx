import {
  GroupList,
  Icons,
  PageControl,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import Encrypted from 'assets/icons/encrypted.svg'
import Keystone from 'assets/icons/keystone.svg'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { SquircleIcon } from 'common/components/SquircleIcon'
import { Redirect, useRouter } from 'expo-router'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  selectIsImportExistingWalletBlocked,
  selectIsKeystoneBlocked,
  selectIsLedgerSupportBlocked
} from 'store/posthog'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { isLimitedMode } from 'utils/limitedMode'

const AccessWalletScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { navigate } = useRouter()
  const isKeystoneBlocked = useSelector(selectIsKeystoneBlocked)
  const isLedgerBlocked = useSelector(selectIsLedgerSupportBlocked)
  const isImportExistingWalletBlocked = useSelector(
    selectIsImportExistingWalletBlocked
  )

  const handleEnterRecoveryPhrase = useCallback((): void => {
    navigate({
      pathname: '/onboarding/mnemonic/termsAndConditions',
      params: { recovering: 'true' }
    })
  }, [navigate])

  const handleEnterKeystone = useCallback((): void => {
    navigate('/onboarding/keystone/termsAndConditions')
  }, [navigate])

  const handleEnterLedger = useCallback((): void => {
    AnalyticsService.capture('OnboardingImportLedgerSelected')
    navigate('/onboarding/ledger/termsAndConditions')
  }, [navigate])

  const handleCreateMnemonicWallet = useCallback((): void => {
    navigate('/onboarding/mnemonic/termsAndConditions')
  }, [navigate])

  // In Hello UI / limited mode the leading icon sits inside a tinted-blue
  // squircle, otherwise we render the raw icon for legacy parity.
  const wrap = useCallback(
    (icon: JSX.Element): JSX.Element =>
      isLimitedMode ? <SquircleIcon>{icon}</SquircleIcon> : icon,
    []
  )

  const data = useMemo(() => {
    const res = []
    res.push({
      title: 'Type in a recovery phrase',
      leftIcon: wrap(<Encrypted color={theme.colors.$textPrimary} />),
      onPress: handleEnterRecoveryPhrase
    })
    if (!isKeystoneBlocked) {
      res.push({
        title: 'Add using Keystone',
        leftIcon: wrap(<Keystone color={theme.colors.$textPrimary} />),
        onPress: handleEnterKeystone
      })
    }
    if (!isLedgerBlocked) {
      res.push({
        title: 'Add using Ledger',
        leftIcon: wrap(
          <Icons.Custom.Ledger
            color={theme.colors.$textPrimary}
            width={24}
            height={24}
          />
        ),
        onPress: handleEnterLedger
      })
    }
    res.push({
      title: 'Create a new wallet',
      leftIcon: wrap(<Icons.Content.Add color={theme.colors.$textPrimary} />),
      onPress: handleCreateMnemonicWallet
    })
    return res
  }, [
    handleCreateMnemonicWallet,
    handleEnterKeystone,
    handleEnterLedger,
    handleEnterRecoveryPhrase,
    isKeystoneBlocked,
    isLedgerBlocked,
    theme.colors,
    wrap
  ])

  // Hello UI footer: 5-step pagination dots anchored bottom-center, with
  // step 1 active (this is the first onboarding decision).
  const renderFooter = useCallback(() => {
    if (!isLimitedMode) return null
    return (
      <View style={{ alignItems: 'center', paddingBottom: 24 }}>
        <PageControl numberOfPage={5} currentPage={0} />
      </View>
    )
  }, [])

  if (isImportExistingWalletBlocked) {
    return <Redirect href="/signup" />
  }

  return (
    <ScrollScreen
      title="How would you like to access your existing wallet?"
      contentContainerStyle={{ padding: 16 }}
      renderFooter={isLimitedMode ? renderFooter : undefined}>
      <View
        style={{
          marginTop: 24
        }}>
        <GroupList data={data} itemHeight={60} />
      </View>
    </ScrollScreen>
  )
}

export default AccessWalletScreen
