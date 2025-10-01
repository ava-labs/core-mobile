import {
  GroupList,
  GroupListItem,
  showAlert,
  Text,
  Toggle,
  useTheme
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { Space } from 'common/components/Space'
import { useRouter } from 'expo-router'
import { useConnectedDapps } from 'features/accountSettings/hooks/useConnectedDapps'
import React, { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import {
  selectCoreAnalyticsConsent,
  selectLockWalletWithPIN,
  setCoreAnalytics,
  setLockWalletWithPIN
} from 'store/settings/securityPrivacy'
import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { useActiveWallet } from 'common/hooks/useActiveWallet'

const SecurityAndPrivacyScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const coreAnalyticsConsent = useSelector(selectCoreAnalyticsConsent)
  const lockWalletWithPIN = useSelector(selectLockWalletWithPIN)
  const { allApprovedDapps } = useConnectedDapps()
  const wallet = useActiveWallet()
  const {
    biometricType,
    isBiometricAvailable,
    useBiometrics,
    setUseBiometrics
  } = useStoredBiometrics()
  const { navigate } = useRouter()

  const handleSwitchBiometric = useCallback(
    (value: boolean): void => {
      setUseBiometrics(value)
      if (value) {
        // @ts-ignore TODO: make routes typesafe
        navigate('/accountSettings/biometricVerifyPin')
      } else {
        BiometricsSDK.disableBiometry().catch(Logger.error)
      }
    },
    [navigate, setUseBiometrics]
  )

  const handleToggleLockWalletWithPIN = useCallback(
    (value: boolean): void => {
      if (value === false) {
        showAlert({
          title: 'Do you really want to disable the PIN code?',
          description:
            'This will remove the PIN requirement when leaving the app and keeping it open in the background.\n\nHowever, pin will be required if the app is closed completely',
          buttons: [
            {
              text: 'Cancel'
            },
            {
              text: 'Disable',
              onPress: () => {
                dispatch(setLockWalletWithPIN(value))
              }
            }
          ]
        })
      } else {
        dispatch(setLockWalletWithPIN(value))
      }
    },
    [dispatch]
  )

  const connectedSitesData = useMemo(() => {
    return [
      {
        title: 'Connected sites',
        onPress: () => {
          // @ts-ignore TODO: make routes typesafe
          navigate('/accountSettings/connectedSites')
        },
        value: allApprovedDapps.length.toString()
      }
    ]
  }, [allApprovedDapps.length, navigate])

  const pinAndBiometricData = useMemo(() => {
    const data: GroupListItem[] = [
      {
        title: 'Require PIN immediately',
        value: (
          <Toggle
            onValueChange={() =>
              handleToggleLockWalletWithPIN(!lockWalletWithPIN)
            }
            testID={lockWalletWithPIN ? 'pin_enabled' : 'pin_disabled'}
            value={lockWalletWithPIN}
          />
        )
      },
      {
        title: 'Change PIN',
        onPress: () => {
          // @ts-ignore TODO: make routes typesafe
          navigate('/accountSettings/verifyChangePin')
        }
      }
    ]

    if (isBiometricAvailable) {
      data.push({
        title: `Use ${biometricType}`,
        value: (
          <Toggle onValueChange={handleSwitchBiometric} value={useBiometrics} />
        )
      })
    }
    return data
  }, [
    lockWalletWithPIN,
    isBiometricAvailable,
    handleToggleLockWalletWithPIN,
    navigate,
    biometricType,
    handleSwitchBiometric,
    useBiometrics
  ])

  const shouldHideRecoveryData = useMemo(
    () => [WalletType.KEYSTONE].includes(wallet.type),
    [wallet.type]
  )

  const recoveryData = useMemo(() => {
    const data = [
      {
        title: 'Show recovery phrase',
        onPress: () => {
          if (wallet.type === WalletType.SEEDLESS) {
            // @ts-ignore TODO: make routes typesafe
            navigate('/accountSettings/seedlessExportPhrase')
            return
          }
          // @ts-ignore TODO: make routes typesafe
          navigate('/accountSettings/recoveryPhraseVerifyPin')
        }
      }
    ]

    if (wallet.type === WalletType.SEEDLESS) {
      data.push({
        title: 'Recovery methods',
        onPress: () => {
          // @ts-ignore TODO: make routes typesafe
          navigate('/accountSettings/addRecoveryMethods')
        }
      })
    }
    return data
  }, [navigate, wallet.type])

  const handleToggleCoreAnalyticsConsent = useCallback(
    (value: boolean): void => {
      AnalyticsService.capture(
        value === true ? 'AnalyticsEnabled' : 'AnalyticsDisabled'
      )
      dispatch(setCoreAnalytics(value))
    },
    [dispatch]
  )

  const coreAnalyticsData = useMemo(() => {
    return [
      {
        title: 'Participate in Core analytics',
        value: (
          <Toggle
            onValueChange={() =>
              handleToggleCoreAnalyticsConsent(!coreAnalyticsConsent)
            }
            testID={
              coreAnalyticsConsent ? 'analytics_enabled' : 'analytics_disabled'
            }
            value={coreAnalyticsConsent}
          />
        )
      }
    ]
  }, [coreAnalyticsConsent, handleToggleCoreAnalyticsConsent])

  return (
    <ScrollScreen
      title={`Security\n& privacy`}
      navigationTitle="Security & privacy"
      isModal
      contentContainerStyle={{ padding: 16 }}>
      <Space y={24} />
      <GroupList
        data={connectedSitesData}
        titleSx={{
          fontSize: 16,
          lineHeight: 22,
          fontFamily: 'Inter-Regular'
        }}
        valueSx={{ fontSize: 16, lineHeight: 22 }}
      />
      <Space y={24} />

      <GroupList
        data={pinAndBiometricData}
        titleSx={{
          fontSize: 16,
          lineHeight: 22,
          fontFamily: 'Inter-Regular'
        }}
        separatorMarginRight={16}
      />
      {!shouldHideRecoveryData && (
        <>
          <Space y={12} />
          <GroupList
            data={recoveryData}
            titleSx={{
              fontSize: 16,
              lineHeight: 22,
              fontFamily: 'Inter-Regular'
            }}
            separatorMarginRight={16}
          />
        </>
      )}
      <Space y={24} />
      <GroupList
        data={coreAnalyticsData}
        titleSx={{
          fontSize: 16,
          lineHeight: 22,
          fontFamily: 'Inter-Regular'
        }}
      />
      <Space y={8} />
      <Text
        variant="caption"
        sx={{ color: colors.$textSecondary, marginRight: 64 }}>
        Core Analytics will collect anonymous interaction data. Core is
        committed to protecting your privacy. We will never sell or share your
        data
      </Text>
    </ScrollScreen>
  )
}

export default SecurityAndPrivacyScreen
