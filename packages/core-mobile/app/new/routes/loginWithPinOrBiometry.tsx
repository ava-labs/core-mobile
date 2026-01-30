import { Button, showAlert, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount, setAccount } from 'store/account'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { copyToClipboard } from 'common/utils/clipboard'
import { PinScreen } from '../common/components/PinScreen'

const LoginWithPinOrBiometry = (): JSX.Element => {
  const router = useRouter()
  const dispatch = useDispatch()
  const activeAccount = useSelector(selectActiveAccount)

  const handleForgotPin = (): void => {
    // @ts-ignore TODO: make routes typesafe
    router.navigate('/forgotPin')
  }

  const handleBiometricPrompt = useCallback(async () => {
    return BiometricsSDK.loadEncryptionKeyWithBiometry()
  }, [])

  // Debug functions to manipulate account state
  const setXpAddressesToEmpty = useCallback(() => {
    if (activeAccount) {
      dispatch(
        setAccount({
          ...activeAccount,
          xpAddresses: []
        })
      )
      Logger.info('[DEBUG] Set xpAddresses to []')
    }
  }, [activeAccount, dispatch])

  const setXpAddressDictionaryToEmpty = useCallback(() => {
    if (activeAccount) {
      dispatch(
        setAccount({
          ...activeAccount,
          xpAddressDictionary: {}
        })
      )
      Logger.info('[DEBUG] Set xpAddressDictionary to {}')
    }
  }, [activeAccount, dispatch])

  const toggleHasMigratedXpAddresses = useCallback(() => {
    if (activeAccount) {
      dispatch(
        setAccount({
          ...activeAccount,
          hasMigratedXpAddresses: !activeAccount.hasMigratedXpAddresses
        })
      )
      Logger.info(
        '[DEBUG] Toggled hasMigratedXpAddresses to',
        !activeAccount.hasMigratedXpAddresses
      )
    }
  }, [activeAccount, dispatch])

  const setAddressPVMToEmpty = useCallback(() => {
    if (activeAccount) {
      dispatch(
        setAccount({
          ...activeAccount,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addressPVM: '' as any
        })
      )
      Logger.info('[DEBUG] Set addressPVM to empty string')
    }
  }, [activeAccount, dispatch])

  const setAddressAVMToEmpty = useCallback(() => {
    if (activeAccount) {
      dispatch(
        setAccount({
          ...activeAccount,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addressAVM: '' as any
        })
      )
      Logger.info('[DEBUG] Set addressAVM to empty string')
    }
  }, [activeAccount, dispatch])

  const viewActiveAccount = useCallback(() => {
    if (!activeAccount) {
      return
    }

    const xpAddressesList =
      activeAccount.xpAddresses && activeAccount.xpAddresses.length > 0
        ? activeAccount.xpAddresses
            .map(
              (addr, idx) => `  [${idx}] ${addr.address} (index: ${addr.index})`
            )
            .join('\n')
        : '  (empty)'

    const xpDictionaryList =
      Object.keys(activeAccount.xpAddressDictionary).length > 0
        ? Object.entries(activeAccount.xpAddressDictionary)
            .map(
              ([address, metadata]) =>
                `  ${address}: space=${metadata.space}, index=${metadata.index}, hasActivity=${metadata.hasActivity}`
            )
            .join('\n')
        : '  (empty)'

    const accountInfo = `
ID: ${activeAccount.id}
Name: ${activeAccount.name}
Index: ${activeAccount.index}
Type: ${activeAccount.type}
Wallet ID: ${activeAccount.walletId}

Addresses:
- C-Chain: ${activeAccount.addressC}
- P-Chain: ${activeAccount.addressPVM || 'N/A'}
- X-Chain: ${activeAccount.addressAVM || 'N/A'}
- BTC: ${activeAccount.addressBTC}
- SVM: ${activeAccount.addressSVM || 'N/A'}

XP Addresses (${activeAccount.xpAddresses?.length || 0}):
${xpAddressesList}

XP Dictionary (${
      Object.keys(activeAccount.xpAddressDictionary).length
    } entries):
${xpDictionaryList}

Has Migrated: ${activeAccount.hasMigratedXpAddresses ? 'Yes' : 'No'}
    `.trim()

    showAlert({
      title: 'Active Account Details',
      description: accountInfo,
      buttons: [
        {
          text: 'Copy to Clipboard',
          onPress: () => {
            copyToClipboard(
              accountInfo,
              'Active Account Details copied to clipboard'
            )
          }
        },
        {
          text: 'Close'
        }
      ]
    })
  }, [activeAccount])

  return (
    <ScrollScreen
      shouldAvoidKeyboard
      hideHeaderBackground
      scrollEnabled={false}
      contentContainerStyle={{ flex: 1 }}>
      <PinScreen
        onForgotPin={handleForgotPin}
        isInitialLogin={true}
        onBiometricPrompt={handleBiometricPrompt}
      />
      {
        <View
          sx={{
            position: 'absolute',
            top: 100,
            left: 16,
            right: 16,
            gap: 8,
            padding: 16,
            backgroundColor: '$surfaceSecondary',
            borderRadius: 12
          }}>
          <Button type="primary" size="small" onPress={viewActiveAccount}>
            View Active Account
          </Button>
          <Button type="secondary" size="small" onPress={setXpAddressesToEmpty}>
            Set xpAddresses to []
          </Button>
          <Button
            type="secondary"
            size="small"
            onPress={setXpAddressDictionaryToEmpty}>
            Set xpAddressDictionary to {'{}'}
          </Button>
          <Button
            type="secondary"
            size="small"
            onPress={toggleHasMigratedXpAddresses}>
            Toggle hasMigratedXpAddresses (currently{' '}
            {activeAccount?.hasMigratedXpAddresses ? 'true' : 'false'})
          </Button>
          <Button type="secondary" size="small" onPress={setAddressPVMToEmpty}>
            Set addressPVM to empty
          </Button>
          <Button type="secondary" size="small" onPress={setAddressAVMToEmpty}>
            Set addressAVM to empty
          </Button>
        </View>
      }
    </ScrollScreen>
  )
}

export default LoginWithPinOrBiometry
