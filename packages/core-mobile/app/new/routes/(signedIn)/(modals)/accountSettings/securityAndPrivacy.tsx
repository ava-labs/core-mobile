import {
  GroupList,
  GroupListItem,
  Text,
  Toggle,
  useTheme
} from '@avalabs/k2-alpine'
import { ScrollViewScreenTemplate } from 'common/components/ScrollViewScreenTemplate'
import { Space } from 'components/Space'
import { useFocusEffect, useRouter } from 'expo-router'
import { useConnectedDapps } from 'features/accountSettings/hooks/useConnectedDapps'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { StorageKey } from 'resources/Constants'
import AnalyticsService from 'services/analytics/AnalyticsService'
import DeviceInfoService, {
  BiometricType
} from 'services/deviceInfo/DeviceInfoService'
import { WalletType } from 'services/wallet/types'
import { selectWalletType } from 'store/app'
import {
  selectCoreAnalyticsConsent,
  setCoreAnalytics
} from 'store/settings/securityPrivacy'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { commonStorage } from 'utils/mmkv'

const SecurityAndPrivacyScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const coreAnalyticsConsent = useSelector(selectCoreAnalyticsConsent)
  const { allApprovedDapps } = useConnectedDapps()
  const walletType = useSelector(selectWalletType)
  const [biometricType, setBiometricType] = useState<BiometricType>(
    BiometricType.NONE
  )
  const { navigate } = useRouter()

  const [isBiometricSwitchEnabled, setIsBiometricSwitchEnabled] =
    useState(false)
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false)

  useFocusEffect(
    useCallback(() => {
      BiometricsSDK.canUseBiometry()
        .then((biometricAvailable: boolean) => {
          setIsBiometricAvailable(biometricAvailable)
        })
        .catch(Logger.error)

      const type = commonStorage.getString(StorageKey.SECURE_ACCESS_SET)
      if (type) {
        setIsBiometricSwitchEnabled(type === 'BIO')
      } else {
        Logger.error('Secure access type not found')
      }
    }, [])
  )

  const handleSwitchBiometric = useCallback(
    (value: boolean): void => {
      setIsBiometricSwitchEnabled(value)
      if (value) {
        navigate('/accountSettings/biometricVerifyPin')
      } else {
        commonStorage.set(StorageKey.SECURE_ACCESS_SET, 'PIN')
      }
    },
    [navigate]
  )

  const connectedSitesData = useMemo(() => {
    return [
      {
        title: 'Connected sites',
        onPress: () => {
          navigate('/accountSettings/connectedSites')
        },
        value: allApprovedDapps.length.toString()
      }
    ]
  }, [allApprovedDapps.length, navigate])

  const pinAndBiometricData = useMemo(() => {
    const data: GroupListItem[] = [
      {
        title: 'Change PIN',
        onPress: () => {
          navigate('/accountSettings/verifyChangePin')
        }
      }
    ]

    if (isBiometricAvailable) {
      data.push({
        title: `Use ${biometricType}`,
        value: (
          <Toggle
            onValueChange={handleSwitchBiometric}
            value={isBiometricSwitchEnabled}
          />
        )
      })
    }
    return data
  }, [
    biometricType,
    handleSwitchBiometric,
    isBiometricAvailable,
    isBiometricSwitchEnabled,
    navigate
  ])

  const recoveryData = useMemo(() => {
    const data = [
      {
        title: 'Show recovery phrase',
        onPress: () => {
          if (walletType === WalletType.SEEDLESS) {
            navigate('/accountSettings/seedlessExportPhrase')
            return
          }
          navigate('/accountSettings/recoveryPhraseVerifyPin')
        }
      }
    ]

    if (walletType === WalletType.SEEDLESS) {
      data.push({
        title: 'Recovery methods',
        onPress: () => {
          navigate('/accountSettings/addRecoveryMethods')
        }
      })
    }
    return data
  }, [navigate, walletType])

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

  useEffect(() => {
    const getBiometryType = async (): Promise<void> => {
      const type = await DeviceInfoService.getBiometricType()
      setBiometricType(type)
    }
    getBiometryType()
  }, [])

  return (
    <ScrollViewScreenTemplate
      title={`Security\n& privacy`}
      navigationTitle="Security & privacy"
      isModal
      contentContainerStyle={{ padding: 16 }}>
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
    </ScrollViewScreenTemplate>
  )
}

export default SecurityAndPrivacyScreen
