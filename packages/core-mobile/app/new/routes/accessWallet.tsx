import { GroupList, Icons, useTheme, View } from '@avalabs/k2-alpine'
import Encrypted from 'assets/icons/encrypted.svg'
import Keystone from 'assets/icons/keystone.svg'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  selectIsKeystoneBlocked,
  selectIsLedgerSupportBlocked
} from 'store/posthog'
import AnalyticsService from 'services/analytics/AnalyticsService'

const AccessWalletScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { navigate } = useRouter()
  const isKeystoneBlocked = useSelector(selectIsKeystoneBlocked)
  const isLedgerBlocked = useSelector(selectIsLedgerSupportBlocked)

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

  const data = useMemo(() => {
    const res = []
    res.push({
      title: 'Type in a recovery phrase',
      leftIcon: <Encrypted color={theme.colors.$textPrimary} />,
      onPress: handleEnterRecoveryPhrase
    })
    if (!isKeystoneBlocked) {
      res.push({
        title: 'Add using Keystone',
        leftIcon: <Keystone color={theme.colors.$textPrimary} />,
        onPress: handleEnterKeystone
      })
    }
    if (!isLedgerBlocked) {
      res.push({
        title: 'Add using Ledger',
        leftIcon: (
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
      leftIcon: <Icons.Content.Add color={theme.colors.$textPrimary} />,
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
    theme.colors
  ])

  return (
    <ScrollScreen
      title="How would you like to access your existing wallet?"
      disableHeaderSnap
      contentContainerStyle={{ padding: 16 }}>
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
