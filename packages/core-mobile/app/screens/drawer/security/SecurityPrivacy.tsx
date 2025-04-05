import React from 'react'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import BiometricsSDK from 'utils/BiometricsSDK'
import Switch from 'components/Switch'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectCoreAnalyticsConsent,
  setCoreAnalytics
} from 'store/settings/securityPrivacy'
import Logger from 'utils/Logger'
import WalletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import { useStoredBiometrics } from 'new/common/hooks/useStoredBiometrics'
import { selectActiveWalletId } from 'store/wallet/slice'

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
  const activeWalletId = useSelector(selectActiveWalletId)
  const { isBiometricAvailable, setUseBiometrics, useBiometrics } =
    useStoredBiometrics()

  const handleSwitchChange = (value: boolean): void => {
    setUseBiometrics(value)
    if (value) {
      onTurnOnBiometrics()
    } else {
      if (activeWalletId) {
        BiometricsSDK.disableBiometry(activeWalletId).catch(Logger.error)
      }
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
      {isBiometricAvailable && (
        <AvaListItem.Base
          title={'Sign in with Biometrics'}
          background={theme.background}
          rightComponent={
            <Switch value={useBiometrics} onValueChange={handleSwitchChange} />
          }
        />
      )}
      <AvaListItem.Base
        title={'Participate in Core Analytics'}
        background={theme.background}
        rightComponent={
          <Switch
            testID={
              coreAnalyticsConsent
                ? 'analytics_enabled_switch'
                : 'analytics_disabled_switch'
            }
            value={coreAnalyticsConsent}
            onValueChange={handleAnalyticsSwitchChange}
          />
        }
      />
    </View>
  )
}

export default SecurityPrivacy
