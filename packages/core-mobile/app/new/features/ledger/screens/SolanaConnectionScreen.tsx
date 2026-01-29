import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert } from 'react-native'
import { ScrollScreen } from 'common/components/ScrollScreen'
import {
  AppConnectionStep,
  LedgerAppConnection
} from 'new/features/ledger/components/LedgerAppConnection'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import Logger from 'utils/Logger'
import LedgerService from 'services/ledger/LedgerService'
import { Button } from '@avalabs/k2-alpine'
import { PrimaryAccount, selectAccountById } from 'store/account'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { LedgerDerivationPathType } from 'services/ledger/types'
import { WalletType } from 'services/wallet/types'
import { useSelector } from 'react-redux'
import { useLedgerWalletMap } from '../store'

export default function SolanaConnectionScreen(): JSX.Element {
  const { accountId } = useLocalSearchParams<{ accountId: string }>()
  const account = useSelector(selectAccountById(accountId))
  const { back, canGoBack } = useRouter()
  const [isUpdatingWallet, setIsUpdatingWallet] = useState(false)
  const wallet = useActiveWallet()
  const { ledgerWalletMap } = useLedgerWalletMap()
  const [currentAppConnectionStep, setAppConnectionStep] = useState<
    AppConnectionStep.SOLANA_CONNECT | AppConnectionStep.SOLANA_LOADING
  >(AppConnectionStep.SOLANA_CONNECT)

  const deviceForWallet = useMemo(() => {
    if (!wallet?.id) return undefined
    return ledgerWalletMap[wallet.id]
  }, [ledgerWalletMap, wallet?.id])

  const {
    connectedDeviceId,
    connectedDeviceName,
    updateSolanaForLedgerWallet,
    connectToDevice,
    setConnectedDevice
  } = useLedgerSetupContext()

  // Cleanup: Stop polling when component unmounts (unless wallet update is in progress)
  useEffect(() => {
    return () => {
      // Only stop polling if we're not in the middle of wallet update
      // If wallet update succeeded, the connection should remain for the wallet to use
      if (!isUpdatingWallet) {
        Logger.info('AppConnectionScreen unmounting, stopping app polling')
        LedgerService.stopAppPolling()
      }
    }
  }, [isUpdatingWallet])

  const handleConnectSolana = useCallback(async () => {
    try {
      if (!account) {
        throw new Error('Account not found')
      }
      setIsUpdatingWallet(true)
      setAppConnectionStep(AppConnectionStep.SOLANA_LOADING)

      // Connect to device if not already connected
      if (connectedDeviceId === null && deviceForWallet?.deviceId) {
        await connectToDevice(deviceForWallet.deviceId)
        setConnectedDevice(deviceForWallet.deviceId, deviceForWallet.deviceName)
      }

      // Get keys from service
      const solanaKeys = await LedgerService.getSolanaKeys(account.index)

      if (solanaKeys.length === 0 || deviceForWallet?.deviceId === undefined) {
        Logger.info('Missing required data for Solana wallet update', {
          solanaKeysCount: solanaKeys.length,
          hasConnectedDeviceId: !!deviceForWallet?.deviceId,
          isUpdatingWallet
        })
        throw new Error('Missing required data for Solana wallet update')
      }

      if (wallet?.id && wallet?.name) {
        await updateSolanaForLedgerWallet({
          deviceId: deviceForWallet.deviceId,
          walletId: wallet.id,
          walletName: wallet.name,
          walletType: wallet.type,
          account: account as PrimaryAccount,
          solanaKeys
        })
      } else {
        Logger.info('Wallet ID or name is missing for Solana wallet update')
      }

      canGoBack() && back()
    } catch (err) {
      Logger.error('Failed to connect to Solana app', err)
      setAppConnectionStep(AppConnectionStep.SOLANA_CONNECT)
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Solana app. Please make sure the Solana app is installed and open on your Ledger.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsUpdatingWallet(false)
    }
  }, [
    account,
    back,
    canGoBack,
    connectToDevice,
    connectedDeviceId,
    deviceForWallet?.deviceId,
    deviceForWallet?.deviceName,
    isUpdatingWallet,
    setConnectedDevice,
    updateSolanaForLedgerWallet,
    wallet.id,
    wallet.name,
    wallet.type
  ])

  const renderFooter = useCallback(() => {
    return (
      <Button
        type="primary"
        size="large"
        onPress={handleConnectSolana}
        disabled={isUpdatingWallet}>
        {'Connect'}
      </Button>
    )
  }, [handleConnectSolana, isUpdatingWallet])
  return (
    <ScrollScreen
      showNavigationHeaderTitle={false}
      hasParent={true}
      isModal={true}
      style={{ paddingTop: 8 }}
      renderFooter={renderFooter}
      contentContainerStyle={{
        flex: 1
      }}>
      <LedgerAppConnection
        deviceName={connectedDeviceName}
        selectedDerivationPath={
          wallet.type === WalletType.LEDGER
            ? LedgerDerivationPathType.BIP44
            : LedgerDerivationPathType.LedgerLive
        }
        isCreatingWallet={isUpdatingWallet}
        connectedDeviceId={connectedDeviceId}
        connectedDeviceName={connectedDeviceName}
        appConnectionStep={currentAppConnectionStep}
        onlySolana={true}
      />
    </ScrollScreen>
  )
}
