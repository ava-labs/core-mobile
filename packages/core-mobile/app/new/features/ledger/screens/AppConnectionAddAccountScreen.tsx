import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { LedgerKeysByNetwork } from 'services/ledger/types'
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
  const { dismiss } = useRouter()
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

  const handleComplete = useCallback(
    async (keys: LedgerKeysByNetwork) => {
      const keysByNetwork = isDeveloperMode ? keys.testnet : keys.mainnet
      if (
        keysByNetwork.avalancheKeys &&
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
            accountIndexToUse: accounts?.length ?? 0,
            deviceId: device.id,
            deviceName: device.name,
            derivationPathType,
            avalancheKeys: keysByNetwork.avalancheKeys,
            solanaKeys: keysByNetwork.solanaKeys
          })

          await setLedgerAddress({
            accountIndex: accounts?.length ?? 0,
            walletId,
            accountId,
            keys
          })

          Logger.info('Account created successfully, dismissing modals')
          // Stop polling since we no longer need app detection
          LedgerService.stopAppPolling()
          showSnackbar('Account added successfully')
        } catch (error) {
          Logger.error('Account creation failed', error)
          showSnackbar('Unable to add account')
        } finally {
          setIsUpdatingWallet(false)
          resetSetup()
          dismiss()
        }
      } else {
        showSnackbar('Unable to add account')
        Logger.info(
          'Account creation conditions not met, skipping account creation',
          {
            hasAvalancheKeys: !!keysByNetwork.avalancheKeys,
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
      completeStepTitle={`Your Account\nis being set up`}
      handleComplete={handleComplete}
      deviceId={device?.id}
      deviceName={device?.name ?? 'Ledger Device'}
      disconnectDevice={disconnectDevice}
      isUpdatingWallet={isUpdatingWallet}
      accountIndex={accounts?.length ?? 0}
    />
  )
}
