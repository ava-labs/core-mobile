import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import BiometricsSDK from 'utils/BiometricsSDK'
import { SECURE_ACCESS_SET } from 'resources/Constants'
import Switch from 'components/Switch'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectCoreAnalyticsConsent,
  setCoreAnalytics
} from 'store/settings/securityPrivacy'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import { commonStorage } from 'store/utils/mmkv'

function SecurityPrivacy({
  onChangePin,
  onShowRecoveryPhrase,
  onRecoveryMethods,
  onTurnOnBiometrics,
  onShowConnectedDapps
}: {
  onChangePin: () => void
  onShowRecoveryPhrase: () => void
  onRecoveryMethods: () => void
  onTurnOnBiometrics: () => void
  onShowConnectedDapps: () => void
}): JSX.Element {
  const theme = useApplicationContext().theme
  const dispatch = useDispatch()
  const coreAnalyticsConsent = useSelector(selectCoreAnalyticsConsent)
  const [isBiometricSwitchEnabled, setIsBiometricSwitchEnabled] =
    useState(false)
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false)

  useEffect(() => {
    BiometricsSDK.canUseBiometry()
      .then((biometryAvailable: boolean) => {
        setIsBiometricEnabled(biometryAvailable)
      })
      .catch(Logger.error)

    commonStorage
      .getItem(SECURE_ACCESS_SET)
      .then((type: string) => {
        setIsBiometricSwitchEnabled(type === 'BIO')
      })
      .catch(Logger.error)
  }, [])

  const handleSwitchChange = (value: boolean): void => {
    setIsBiometricSwitchEnabled(value)
    if (value) {
      onTurnOnBiometrics()
    } else {
      commonStorage.setItem(SECURE_ACCESS_SET, 'PIN')
    }
  }

  const handleAnalyticsSwitchChange = (value: boolean): void => {
    dispatch(setCoreAnalytics(value))
  }

  return (
    <View style={{ backgroundColor: theme.colorBg2 }}>
      <AvaListItem.Base
        title={'Connected Sites'}
        background={theme.background}
        showNavigationArrow
        onPress={onShowConnectedDapps}
        testID="security_privacy__connected_sites"
      />
      <AvaListItem.Base
        title={'Change PIN'}
        background={theme.background}
        showNavigationArrow
        onPress={onChangePin}
      />
      <AvaListItem.Base
        title={'Show recovery phrase'}
        background={theme.background}
        showNavigationArrow
        onPress={onShowRecoveryPhrase}
      />
      {WalletService.walletType === WalletType.SEEDLESS && (
        <AvaListItem.Base
          title={'Recovery Methods'}
          background={theme.background}
          showNavigationArrow
          onPress={onRecoveryMethods}
        />
      )}
      {isBiometricEnabled && (
        <AvaListItem.Base
          title={'Sign in with Biometrics'}
          background={theme.background}
          rightComponent={
            <Switch
              value={isBiometricSwitchEnabled}
              onValueChange={handleSwitchChange}
            />
          }
        />
      )}
      <AvaListItem.Base
        title={'Participate in CoreAnalytics'}
        background={theme.background}
        rightComponent={
          <Switch
            value={coreAnalyticsConsent}
            onValueChange={handleAnalyticsSwitchChange}
          />
        }
      />
    </View>
  )
}

export default SecurityPrivacy
