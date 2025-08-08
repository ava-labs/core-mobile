import React, { useState, useEffect } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDispatch } from 'react-redux'

import { Button, Card, Text as K2Text, useTheme } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import LedgerService, { AddressInfo } from 'services/ledger/ledgerService'
import { WalletType } from 'services/wallet/types'
import { storeWallet } from 'store/wallet/thunks'
import { setActiveWallet } from 'store/wallet/slice'
import { setAccount, setActiveAccount } from 'store/account'
import { CoreAccountType } from '@avalabs/types'
import { uuid } from 'utils/uuid'
import Logger from 'utils/Logger'
import { AppThunkDispatch } from 'store/types'
import { PrimaryAccount } from 'store/account/types'

export default function ConfirmAddresses(): JSX.Element {
  const router = useRouter()
  const dispatch = useDispatch<AppThunkDispatch>()
  const {
    theme: { colors }
  } = useTheme()
  const params = useLocalSearchParams<{ deviceId: string }>()

  const [isLoading, setIsLoading] = useState(false)
  const [addresses, setAddresses] = useState<AddressInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  const connectToDevice = async () => {
    if (!params.deviceId) {
      setError('No device ID provided')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await LedgerService.connect(params.deviceId)
      Logger.info('Successfully connected to Ledger device')

      // Get addresses for the first account
      const deviceAddresses = await LedgerService.getAllAddresses(0, 1)
      setAddresses(deviceAddresses)
    } catch (err) {
      Logger.error('Failed to connect to Ledger:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect to Ledger device'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!params.deviceId) {
      setError('No device ID provided')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get extended public keys for wallet creation
      const extendedPublicKeys = await LedgerService.getExtendedPublicKeys()

      // Get individual public keys for the first account
      const publicKeys = await LedgerService.getPublicKeys(0, 1)

      // Create wallet data to store
      const walletId = uuid()
      const walletData = {
        deviceId: params.deviceId,
        derivationPath: "m/44'/60'/0'/0/0",
        vmType: 'EVM',
        derivationPathSpec: 'BIP44',
        extendedPublicKeys: {
          evm: extendedPublicKeys.evm.key,
          avalanche: extendedPublicKeys.avalanche.key
        },
        publicKeys: publicKeys.map(pk => ({
          key: pk.key,
          derivationPath: pk.derivationPath,
          curve: pk.curve,
          type: 'address-pubkey'
        }))
      }

      // Store the wallet
      await dispatch(
        storeWallet({
          walletId,
          walletSecret: JSON.stringify(walletData),
          type: WalletType.LEDGER
        })
      ).unwrap()

      // Set as active wallet
      dispatch(setActiveWallet(walletId))

      // Create account from addresses
      const evmAddress = addresses.find(
        addr => addr.network === 'AVALANCHE_C_EVM'
      )
      const xChainAddress = addresses.find(
        addr => addr.network === 'AVALANCHE_X'
      )
      const pChainAddress = addresses.find(
        addr => addr.network === 'AVALANCHE_P'
      )
      const btcAddress = addresses.find(addr => addr.network === 'BITCOIN')

      const accountId = uuid()
      const account: PrimaryAccount = {
        id: accountId,
        walletId,
        name: 'Account 1',
        type: CoreAccountType.PRIMARY,
        index: 0,
        addressC: evmAddress?.address || '',
        addressAVM: xChainAddress?.address || '',
        addressPVM: pChainAddress?.address || '',
        addressBTC: btcAddress?.address || '',
        addressSVM: '',
        addressCoreEth: evmAddress?.address || ''
      }

      Logger.info('Created account:', account)

      // Store account and set as active
      dispatch(setAccount(account))
      dispatch(setActiveAccount(accountId))

      Logger.info('Successfully created Ledger wallet and account')

      // Navigate to success screen
      router.push(
        '/(signedIn)/(modals)/accountSettings/ledger/importSuccess' as any
      )
    } catch (err) {
      Logger.error('Failed to create Ledger wallet:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to create Ledger wallet'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  // Auto-connect when component mounts
  useEffect(() => {
    connectToDevice()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      LedgerService.disconnect().catch(Logger.error)
    }
  }, [])

  return (
    <ScrollScreen>
      <View style={{ padding: 16 }}>
        <K2Text variant="heading4" sx={{ marginBottom: 24 }}>
          Confirm Addresses
        </K2Text>

        {error && (
          <Card
            sx={{
              marginBottom: 12,
              padding: 16,
              backgroundColor: colors.$surfaceTertiary
            }}>
            <K2Text variant="body2" sx={{ color: colors.$textDanger }}>
              {error}
            </K2Text>
          </Card>
        )}

        {isLoading ? (
          <Card sx={{ marginBottom: 12, padding: 16 }}>
            <K2Text variant="body1">
              {addresses.length > 0
                ? 'Creating wallet...'
                : 'Connecting to Ledger device...'}
            </K2Text>
          </Card>
        ) : addresses.length > 0 ? (
          <View>
            <K2Text variant="body1" sx={{ marginBottom: 16 }}>
              Please verify these addresses on your Ledger device:
            </K2Text>

            {addresses.map(address => (
              <Card key={address.id} sx={{ marginBottom: 8, padding: 12 }}>
                <K2Text variant="subtitle2" sx={{ marginBottom: 4 }}>
                  {address.network}
                </K2Text>
                <K2Text variant="body2" sx={{ fontFamily: 'DejaVuSansMono' }}>
                  {address.address}
                </K2Text>
                <K2Text variant="caption" sx={{ color: colors.$textSecondary }}>
                  {address.derivationPath}
                </K2Text>
              </Card>
            ))}

            <View style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                onPress={handleConfirm}
                style={{ marginBottom: 12 }}>
                Confirm and Import
              </Button>
              <Button type="secondary" size="large" onPress={handleBack}>
                Back
              </Button>
            </View>
          </View>
        ) : null}
      </View>
    </ScrollScreen>
  )
}
