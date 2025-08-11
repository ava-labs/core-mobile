import React, { useState, useCallback, useEffect } from 'react'
import { Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import {
  View,
  Text,
  Button,
  Card,
  Icons,
  useTheme,
  CircularProgress
} from '@avalabs/k2-alpine'
import { LoadingState } from 'new/common/components/LoadingState'
import { LedgerService, LedgerAppType } from 'services/ledger/ledgerService'
import { WalletType } from 'services/wallet/types'
import { AppThunkDispatch } from 'store/types'
import { storeWallet } from 'store/wallet/thunks'
import { setActiveWallet } from 'store/wallet/slice'
import { setAccount, setActiveAccount, selectAccounts } from 'store/account'
import { Account } from 'store/account/types'
import { CoreAccountType } from '@avalabs/types'
import { showSnackbar } from 'new/common/utils/toast'
import { uuid } from 'utils/uuid'
import Logger from 'utils/Logger'
import { ScrollScreen } from 'common/components/ScrollScreen'
import bs58 from 'bs58'

export default function ConfirmAddresses() {
  const params = useLocalSearchParams<{
    deviceId: string
    deviceName: string
  }>()
  const [step, setStep] = useState<
    'connecting' | 'solana' | 'avalanche' | 'complete'
  >('connecting')
  const [isLoading, setIsLoading] = useState(false)
  const [solanaKeys, setSolanaKeys] = useState<any[]>([])
  const [avalancheKeys, setAvalancheKeys] = useState<any>(null)
  const [bitcoinAddress, setBitcoinAddress] = useState<string>('')
  const [xpAddress, setXpAddress] = useState<string>('')
  const [ledgerService] = useState(() => new LedgerService())
  const dispatch = useDispatch<AppThunkDispatch>()
  const router = useRouter()
  const allAccounts = useSelector(selectAccounts)
  const {
    theme: { colors }
  } = useTheme()

  const getSolanaKeys = useCallback(async () => {
    try {
      setIsLoading(true)
      Logger.info('Getting Solana keys with passive app detection')

      // Wait for Solana app to be open (passive detection)
      await ledgerService.waitForApp(LedgerAppType.SOLANA)

      // Get Solana keys
      const keys = await ledgerService.getSolanaPublicKeys(0)
      setSolanaKeys(keys)
      Logger.info('Successfully got Solana keys', keys)

      // Prompt for app switch while staying on Solana step
      promptForAvalancheSwitch()
    } catch (error) {
      Logger.error('Failed to get Solana keys', error)
      Alert.alert(
        'Solana App Required',
        'Please open the Solana app on your Ledger device, then tap "I\'ve Switched" when ready.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: "I've Switched", onPress: getSolanaKeys }
        ]
      )
    } finally {
      setIsLoading(false)
    }
  }, [ledgerService, promptForAvalancheSwitch])

  const promptForAvalancheSwitch = useCallback(async () => {
    Alert.alert(
      'Switch to Avalanche App',
      'Please switch to the Avalanche app on your Ledger device, then tap "I\'ve Switched" to continue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: "I've Switched",
          onPress: async () => {
            try {
              setIsLoading(true)
              Logger.info('=== RECONNECTION STARTED ===')
              Logger.info(
                'User confirmed Avalanche app switch, reconnecting...'
              )

              // Force disconnect and reconnect to refresh the connection
              Logger.info('Disconnecting...')
              await ledgerService.disconnect()
              Logger.info('Disconnected successfully')

              Logger.info('Waiting 1 second...')
              await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second

              Logger.info('Reconnecting...')
              await ledgerService.connect(params.deviceId!)
              Logger.info('Reconnected successfully')

              // Move to Avalanche step and get keys
              setStep('avalanche')
              Logger.info('Calling getAvalancheKeys...')
              await getAvalancheKeys()
              Logger.info('=== RECONNECTION COMPLETED ===')
            } catch (error) {
              Logger.error('Failed to reconnect for Avalanche:', error)
              Alert.alert(
                'Reconnection Failed',
                'Failed to reconnect to the device. Please try again.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Retry', onPress: promptForAvalancheSwitch }
                ]
              )
            } finally {
              setIsLoading(false)
            }
          }
        }
      ]
    )
  }, [ledgerService, params.deviceId, getAvalancheKeys])

  const getAvalancheKeys = useCallback(async () => {
    try {
      setIsLoading(true)
      Logger.info('=== getAvalancheKeys STARTED ===')

      // Get Avalanche addresses (getAllAddresses will handle app detection internally)
      Logger.info('Calling getAllAddresses...')
      const addresses = await ledgerService.getAllAddresses(0, 1)
      Logger.info('Avalanche app detected successfully')
      Logger.info('Successfully got Avalanche addresses:', addresses)

      // Extract addresses from the response
      const evmAddress = addresses.find(addr => addr.network === 'Avalanche C-Chain/EVM')?.address || ''
      const xpAddress = addresses.find(addr => addr.network === 'Avalanche X-Chain')?.address || ''
      const pvmAddress = addresses.find(addr => addr.network === 'Avalanche P-Chain')?.address || ''
      const btcAddress = addresses.find(addr => addr.network === 'Bitcoin')?.address || ''

      // Set the addresses
      setAvalancheKeys({
        evm: { key: evmAddress },
        avalanche: { key: xpAddress },
        pvm: { key: pvmAddress }
      })
      setBitcoinAddress(btcAddress)
      setXpAddress(xpAddress)
      
      Logger.info('Successfully extracted addresses:', {
        evm: evmAddress,
        xp: xpAddress,
        pvm: pvmAddress,
        btc: btcAddress
      })

      // Successfully got all keys, move to complete step
      Logger.info('Setting step to complete...')
      setStep('complete')
      Logger.info('Ledger setup completed successfully')
    } catch (error) {
      Logger.error('Failed to get Avalanche keys:', error)
      Alert.alert(
        'Avalanche App Required',
        'Please ensure the Avalanche app is open on your Ledger device, then tap "Retry".',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: getAvalancheKeys }
        ]
      )
    } finally {
      setIsLoading(false)
      Logger.info('=== getAvalancheKeys FINISHED ===')
    }
  }, [ledgerService])

  const connectToDevice = useCallback(async () => {
    try {
      setIsLoading(true)
      await ledgerService.connect(params.deviceId)
      Logger.info('Connected to Ledger device')
      setStep('solana')
      // Start with Solana keys (passive detection will handle app switching)
      await getSolanaKeys()
    } catch (error) {
      Logger.error('Failed to connect to device', error)
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Ledger device. Please ensure your device is unlocked and try again.',
        [{ text: 'OK' }]
      )
    } finally {
      setIsLoading(false)
    }
  }, [ledgerService, params.deviceId, getSolanaKeys])

  const createLedgerWallet = useCallback(async () => {
    try {
      setIsLoading(true)
      Logger.info('Creating Ledger wallet with generated keys...')

      if (!avalancheKeys || solanaKeys.length === 0 || !bitcoinAddress) {
        throw new Error('Missing required keys for wallet creation')
      }

      const newWalletId = uuid()

      // Store the Ledger wallet
      await dispatch(
        storeWallet({
          walletId: newWalletId,
          walletSecret: JSON.stringify({
            deviceId: params.deviceId,
            deviceName: params.deviceName || 'Ledger Device',
            derivationPath: "m/44'/60'/0'/0/0", // Standard EVM derivation path
            vmType: 'EVM', // NetworkVMType.EVM
            derivationPathSpec: 'BIP44', // Use BIP44 derivation
            extendedPublicKeys: {
              evm: avalancheKeys.evm.key,
              avalanche: avalancheKeys.avalanche.key
            },
            publicKeys: [
              {
                key: avalancheKeys.evm.key,
                derivationPath: "m/44'/60'/0'/0/0",
                curve: 'secp256k1'
              },
              {
                key: avalancheKeys.avalanche.key,
                derivationPath: "m/44'/9000'/0'/0/0",
                curve: 'secp256k1'
              },
              {
                key: avalancheKeys.pvm?.key || avalancheKeys.avalanche.key,
                derivationPath: "m/44'/9000'/0'/0/0", // P-Chain uses same path as AVM
                curve: 'secp256k1'
              },
              {
                key: solanaKeys[0]?.key || '',
                derivationPath: "m/44'/501'/0'/0'",
                curve: 'ed25519'
              }
            ],
            avalancheKeys,
            solanaKeys
          }),
          type: WalletType.LEDGER
        })
      ).unwrap()

      dispatch(setActiveWallet(newWalletId))

      // Create addresses from the keys
      const addresses = {
        EVM: avalancheKeys.evm.key,
        AVM: avalancheKeys.avalanche.key,
        PVM: avalancheKeys.pvm?.key || avalancheKeys.avalanche.key, // Use P-Chain address if available, fallback to AVM
        BITCOIN: bitcoinAddress,
        SVM: solanaKeys[0]?.key ? bs58.encode(new Uint8Array(Buffer.from(solanaKeys[0].key, 'hex'))) : '',
        CoreEth: '' // Not implemented yet
      }

      const allAccountsCount = Object.keys(allAccounts).length

      const newAccountId = uuid()
      const newAccount: Account = {
        id: newAccountId,
        walletId: newWalletId,
        name: `Account ${allAccountsCount + 1}`,
        type: CoreAccountType.PRIMARY,
        index: 0,
        addressC: addresses.EVM,
        addressBTC: addresses.BITCOIN,
        addressAVM: addresses.AVM,
        addressPVM: addresses.PVM,
        addressSVM: addresses.SVM,
        addressCoreEth: addresses.CoreEth
      }

      dispatch(setAccount(newAccount))
      dispatch(setActiveAccount(newAccountId))

      Logger.info('Ledger wallet created successfully:', newWalletId)
      showSnackbar('Ledger wallet created successfully!')

      // Navigate to manage accounts
      router.push('/accountSettings/manageAccounts' as any)
    } catch (error) {
      Logger.error('Failed to create Ledger wallet:', error)
      showSnackbar(
        `Failed to create wallet: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    } finally {
      setIsLoading(false)
    }
  }, [
    avalancheKeys,
    solanaKeys,
    bitcoinAddress,
    dispatch,
    params.deviceId,
    params.deviceName,
    allAccounts,
    router
  ])

  useEffect(() => {
    if (params.deviceId) {
      connectToDevice()
    } else {
      Logger.error('No deviceId provided in params')
      Alert.alert('Error', 'No device ID provided')
    }
  }, [connectToDevice, params.deviceId])



  const renderStepTitle = () => {
    switch (step) {
      case 'connecting':
        return 'Connecting to Ledger'
      case 'solana':
        return 'Solana Setup'
      case 'avalanche':
        return 'Avalanche Setup'
      case 'complete':
        return 'Setup Complete'
      default:
        return 'Confirm Addresses'
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 'connecting':
        return (
          <View
            sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <LoadingState />
            <Text
              variant="heading6"
              sx={{
                marginTop: 24,
                textAlign: 'center',
                color: '$textPrimary'
              }}>
              Connecting to your Ledger device...
            </Text>
            <Text
              variant="body2"
              sx={{
                marginTop: 8,
                textAlign: 'center',
                color: '$textSecondary'
              }}>
              Please ensure your device is unlocked and nearby
            </Text>
          </View>
        )

      case 'solana':
        return (
          <View sx={{ flex: 1, padding: 20 }}>
            <Card sx={{ marginBottom: 24 }}>
              <View sx={{ alignItems: 'center', padding: 20 }}>
                {isLoading ? (
                  <LoadingState />
                ) : (
                  <Icons.Action.CheckCircleOutline
                    width={48}
                    height={48}
                    color={colors.$textSuccess}
                  />
                )}
                <Text
                  variant="heading6"
                  sx={{
                    marginTop: 16,
                    textAlign: 'center',
                    color: '$textPrimary'
                  }}>
                  {isLoading ? 'Getting Solana Keys...' : 'Solana Keys Retrieved'}
                </Text>
                <Text
                  variant="body2"
                  sx={{
                    marginTop: 8,
                    textAlign: 'center',
                    color: '$textSecondary'
                  }}>
                  {isLoading
                    ? 'Please open the Solana app on your Ledger device'
                    : 'Successfully retrieved Solana public keys'}
                </Text>
              </View>
            </Card>
          </View>
        )

      case 'avalanche':
        return (
          <View sx={{ flex: 1, padding: 20 }}>
            <Card sx={{ marginBottom: 24 }}>
              <View sx={{ alignItems: 'center', padding: 20 }}>
                {isLoading ? (
                  <LoadingState />
                ) : (
                  <Icons.Action.CheckCircleOutline
                    width={48}
                    height={48}
                    color={colors.$textSuccess}
                  />
                )}
                <Text
                  variant="heading6"
                  sx={{
                    marginTop: 16,
                    textAlign: 'center',
                    color: '$textPrimary'
                  }}>
                  {isLoading ? 'Getting Avalanche Keys...' : 'Avalanche Keys Retrieved'}
                </Text>
                <Text
                  variant="body2"
                  sx={{
                    marginTop: 8,
                    textAlign: 'center',
                    color: '$textSecondary'
                  }}>
                  {isLoading
                    ? 'Please open the Avalanche app on your Ledger device'
                    : 'Successfully retrieved Avalanche public keys'}
                </Text>
              </View>
            </Card>
          </View>
        )

      case 'complete':
        return (
          <View sx={{ flex: 1, padding: 20 }}>
            <Card sx={{ marginBottom: 24 }}>
              <View sx={{ alignItems: 'center', padding: 20 }}>
                <Icons.Action.CheckCircleOutline
                  width={48}
                  height={48}
                  color={colors.$textSuccess}
                />
                <Text
                  variant="heading6"
                  sx={{
                    marginTop: 16,
                    textAlign: 'center',
                    color: '$textPrimary'
                  }}>
                  All Keys Retrieved Successfully
                </Text>
                <Text
                  variant="body2"
                  sx={{
                    marginTop: 8,
                    textAlign: 'center',
                    color: '$textSecondary'
                  }}>
                  Your Ledger wallet is ready to be created
                </Text>
              </View>
            </Card>

            <View sx={{ marginBottom: 24 }}>
              <Text
                variant="heading6"
                sx={{ marginBottom: 16, color: '$textPrimary' }}>
                Generated Addresses:
              </Text>

              {avalancheKeys && avalancheKeys.evm.key && (
                <View sx={{ marginBottom: 12 }}>
                  <Text
                    variant="subtitle2"
                    sx={{ color: '$textSecondary', marginBottom: 4 }}>
                    Avalanche (EVM):
                  </Text>
                  <Text
                    variant="body2"
                    sx={{
                      color: '$textPrimary',
                      fontFamily: 'DejaVuSansMono'
                    }}>
                    {avalancheKeys.evm.key}
                  </Text>
                </View>
              )}

              {xpAddress && (
                <View sx={{ marginBottom: 12 }}>
                  <Text
                    variant="subtitle2"
                    sx={{ color: '$textSecondary', marginBottom: 4 }}>
                    Avalanche (X/P):
                  </Text>
                  <Text
                    variant="body2"
                    sx={{
                      color: '$textPrimary',
                      fontFamily: 'DejaVuSansMono'
                    }}>
                    {xpAddress}
                  </Text>
                </View>
              )}

              {bitcoinAddress && (
                <View sx={{ marginBottom: 12 }}>
                  <Text
                    variant="subtitle2"
                    sx={{ color: '$textSecondary', marginBottom: 4 }}>
                    Bitcoin:
                  </Text>
                  <Text
                    variant="body2"
                    sx={{
                      color: '$textPrimary',
                      fontFamily: 'DejaVuSansMono'
                    }}>
                    {bitcoinAddress}
                  </Text>
                </View>
              )}

              {solanaKeys.length > 0 && (
                <View sx={{ marginBottom: 12 }}>
                  <Text
                    variant="subtitle2"
                    sx={{ color: '$textSecondary', marginBottom: 4 }}>
                    Solana:
                  </Text>
                  <Text
                    variant="body2"
                    sx={{
                      color: '$textPrimary',
                      fontFamily: 'DejaVuSansMono'
                    }}>
                    {solanaKeys[0].key.substring(0, 20)}...
                  </Text>
                </View>
              )}
            </View>

            <Button
              type="primary"
              size="large"
              onPress={createLedgerWallet}
              disabled={isLoading}>
              {isLoading ? 'Creating Wallet...' : 'Create Ledger Wallet'}
            </Button>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <ScrollScreen isModal>
      <View sx={{ padding: 20, paddingBottom: 0 }}>
        <Text
          variant="heading4"
          sx={{ color: '$textPrimary', marginBottom: 8 }}>
          {renderStepTitle()}
        </Text>

        {step !== 'connecting' && (
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 20
            }}>
            <CircularProgress
              progress={
                step === 'solana' ? 0.33 : step === 'avalanche' ? 0.66 : 1
              }
              size={24}
              style={{ marginRight: 12 }}
            />
            <Text variant="body2" sx={{ color: '$textSecondary' }}>
              Step {step === 'solana' ? '1' : step === 'avalanche' ? '2' : '3'}{' '}
              of 3
            </Text>
          </View>
        )}
      </View>

      {renderStepContent()}
    </ScrollScreen>
  )
}
