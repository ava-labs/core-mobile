import React, { useCallback, useState } from 'react'
import PinOrBiometryLogin from 'screens/login/PinOrBiometryLogin'
import { setPinRecovery } from 'utils/Navigation'
import { useWallet } from 'hooks/useWallet'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Logger from 'utils/Logger'
import { useSelector } from 'react-redux'
import { selectWalletType } from 'store/app'
import ForgotPin from 'screens/mainView/ForgotPin'
import { WalletType } from 'services/wallet/types'

export const LoginWithPinOrBiometryScreen = (): JSX.Element => {
  const { unlock } = useWallet()
  const { signOut } = useApplicationContext().appHook
  const walletType = useSelector(selectWalletType)
  const [forgotPin, setForgotPin] = useState(false)

  const handleConfirmForgotPin = (): void => {
    if (walletType === WalletType.MNEMONIC) {
      signOut()
    } else if (walletType === WalletType.SEEDLESS) {
      setPinRecovery(true)
      signOut()
    }
  }

  const handleCancelForgotPin = (): void => {
    setForgotPin(false)
  }

  const handleLoginSuccess = useCallback(
    (mnemonic: string) => {
      unlock({ mnemonic }).catch(Logger.error)
    },
    [unlock]
  )
  const handleForgotPin = (): void => {
    setForgotPin(true)
  }

  return forgotPin ? (
    <ForgotPin
      onConfirm={handleConfirmForgotPin}
      onCancel={handleCancelForgotPin}
    />
  ) : (
    <PinOrBiometryLogin
      onForgotPin={handleForgotPin}
      onLoginSuccess={handleLoginSuccess}
    />
  )
}
