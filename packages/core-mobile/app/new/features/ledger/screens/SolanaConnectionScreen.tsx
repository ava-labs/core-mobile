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
import { useSelector } from 'react-redux'
import { useLedgerWalletMap } from '../store'
import { useLedgerWallet } from '../hooks/useLedgerWallet'

export default function SolanaConnectionScreen(): JSX.Element {
  const { accountId } = useLocalSearchParams<{ accountId: string }>()
  const account = useSelector(selectAccountById(accountId))
  const { back, canGoBack } = useRouter()
  const wallet = useActiveWallet()
  const { getLedgerInfoByWalletId } = useLedgerWalletMap()
  const [currentAppConnectionStep, setAppConnectionStep] = useState<
    AppConnectionStep.SOLANA_CONNECT | AppConnectionStep.SOLANA_LOADING
  >(AppConnectionStep.SOLANA_CONNECT)

  const {
    connectedDeviceId,
    connectedDeviceName,
    isUpdatingWallet,
    setIsUpdatingWallet,
    connectToDevice,
    resetSetup
  } = useLedgerSetupContext()

  const deviceForWallet = useMemo(() => {
    return getLedgerInfoByWalletId(wallet?.id)?.device
  }, [getLedgerInfoByWalletId, wallet?.id])

  const { updateSolanaForLedgerWallet } = useLedgerWallet()

  // Cleanup: Stop polling when component unmounts
  useEffect(() => {
    return () => {
      Logger.info('SolanaConnectionScreen unmounting, stopping app polling')
      LedgerService.stopAppPolling()
    }
  }, [])

  const handleConnectSolana = useCallback(async () => {
    try {
      if (!account) {
        throw new Error('Account not found')
      }
      setIsUpdatingWallet(true)
      setAppConnectionStep(AppConnectionStep.SOLANA_LOADING)

      // Connect to device if not already connected
      if (connectedDeviceId === null && deviceForWallet) {
        await connectToDevice(deviceForWallet.id, deviceForWallet.name)
      }

      // Get keys from service
      const solanaKeys = await LedgerService.getSolanaKeys(account.index)

      if (solanaKeys.length === 0 || deviceForWallet === undefined) {
        Logger.info('Missing required data for Solana wallet update', {
          solanaKeysCount: solanaKeys.length,
          hasConnectedDeviceId: !!deviceForWallet?.id,
          isUpdatingWallet
        })
        throw new Error('Missing required data for Solana wallet update')
      }

      if (wallet?.id && wallet?.name) {
        await updateSolanaForLedgerWallet({
          deviceId: deviceForWallet.id,
          walletId: wallet.id,
          walletName: wallet.name,
          walletType: wallet.type,
          account: account as PrimaryAccount,
          solanaKeys
        })
      } else {
        Logger.info('Wallet ID or name is missing for Solana wallet update')
      }
      resetSetup()
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
    setIsUpdatingWallet,
    connectedDeviceId,
    deviceForWallet,
    wallet,
    resetSetup,
    canGoBack,
    back,
    connectToDevice,
    isUpdatingWallet,
    updateSolanaForLedgerWallet
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
        connectedDeviceId={connectedDeviceId}
        connectedDeviceName={connectedDeviceName}
        appConnectionStep={currentAppConnectionStep}
        onlySolana={true}
      />
    </ScrollScreen>
  )
}
