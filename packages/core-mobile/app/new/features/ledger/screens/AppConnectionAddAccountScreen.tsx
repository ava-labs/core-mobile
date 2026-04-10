import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { LedgerMultiIndexKeys } from 'services/ledger/types'
import Logger from 'utils/Logger'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import LedgerService from 'services/ledger/LedgerService'
import { selectWalletById } from 'store/wallet/slice'
import { RootState } from 'store/types'
import { selectAccountsByWalletId } from 'store/account'
import { showSnackbar } from 'common/utils/toast'
import { useLedgerWallet } from '../hooks/useLedgerWallet'
import { useSetLedgerAddress } from '../hooks/useSetLedgerAddress'
import { useLedgerSetupContext } from '../contexts/LedgerSetupContext'
import { useLedgerWalletMap } from '../store'
import AppConnectionScreen from './AppConnectionScreen'

export const AppConnectionAddAccountScreen = (): JSX.Element => {
  const { walletId } = useLocalSearchParams<{ walletId: string }>()
  const { dismiss, canGoBack, back } = useRouter()
  const { createLedgerAccount } = useLedgerWallet()
  const { setLedgerAddress } = useSetLedgerAddress()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const wallet = useSelector(selectWalletById(walletId))
  const accounts = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, walletId)
  )
  const { getLedgerInfoByWalletId } = useLedgerWalletMap()

  const { device, derivationPathType } = useMemo(() => {
    return getLedgerInfoByWalletId(walletId)
  }, [getLedgerInfoByWalletId, walletId])

  const {
    resetSetup,
    disconnectDevice,
    isUpdatingWallet,
    setIsUpdatingWallet
  } = useLedgerSetupContext()

  const handleCancel = useCallback(async () => {
    await disconnectDevice().catch(error => {
      Logger.error('Failed to disconnect Ledger device on cancel', error)
    })
    canGoBack() && back()
  }, [disconnectDevice, canGoBack, back])

  const handleComplete = useCallback(
    async (multiIndexKeys: LedgerMultiIndexKeys) => {
      // When adding a single account, the keys are stored at the account index
      const accountIndex = accounts?.length ?? 0
      const keys = {
        mainnet: multiIndexKeys.mainnet[accountIndex],
        testnet: multiIndexKeys.testnet[accountIndex]
      }
      const keysByNetwork = isDeveloperMode ? keys.testnet : keys.mainnet
      if (
        keysByNetwork?.avalancheKeys &&
        device &&
        wallet &&
        accounts?.length > 0 &&
        derivationPathType &&
        !isUpdatingWallet
      ) {
        Logger.info('All conditions met, creating account...')
        setIsUpdatingWallet(true)

        try {
          const { accountId } = await createLedgerAccount({
            walletId: wallet.id,
            walletName: wallet.name,
            walletType: wallet.type,
            accountIndexToUse: accountIndex,
            deviceId: device.id,
            deviceName: device.name,
            derivationPathType,
            avalancheKeys: keysByNetwork.avalancheKeys,
            solanaKeys: keysByNetwork.solanaKeys
          })

          await setLedgerAddress({
            accountIndex: accountIndex,
            walletId,
            accountId,
            keys: {
              mainnet: keys.mainnet ?? {
                solanaKeys: [],
                avalancheKeys: undefined
              },
              testnet: keys.testnet ?? {
                solanaKeys: [],
                avalancheKeys: undefined
              }
            }
          })

          Logger.info('Account created successfully, dismissing modals')
        } catch (error) {
          Logger.error('Account creation failed', error)
          showSnackbar('Unable to add account')
        } finally {
          // Stop polling since we no longer need app detection
          LedgerService.stopAppPolling()
          setIsUpdatingWallet(false)
          resetSetup()
          dismiss()
        }
      } else {
        showSnackbar('Unable to add account')
        Logger.error(
          'Account creation conditions not met, skipping account creation',
          {
            hasAvalancheKeys: !!keysByNetwork?.avalancheKeys,
            hasConnectedDeviceId: !!device?.id,
            hasSelectedDerivationPath: !!derivationPathType,
            isUpdatingWallet
          }
        )
        resetSetup()
        dismiss()
      }
    },
    [
      device,
      wallet,
      accounts?.length,
      derivationPathType,
      isUpdatingWallet,
      setIsUpdatingWallet,
      createLedgerAccount,
      setLedgerAddress,
      walletId,
      isDeveloperMode,
      resetSetup,
      dismiss
    ]
  )

  return (
    <AppConnectionScreen
      selectedDerivationPath={derivationPathType}
      completeStepTitle={`Your Account\nis being set up`}
      handleComplete={handleComplete}
      deviceId={device?.id}
      deviceName={device?.name ?? 'Ledger'}
      handleCancel={handleCancel}
      isUpdatingWallet={isUpdatingWallet}
      accountIndex={accounts?.length ?? 0}
      showCancelOnComplete={true}
      showConnectionToasts={true}
    />
  )
}
