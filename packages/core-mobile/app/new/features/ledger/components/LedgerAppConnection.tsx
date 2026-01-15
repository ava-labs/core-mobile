import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { View, Alert, ActivityIndicator } from 'react-native'
import { Text, Button, useTheme, Icons, GroupList } from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { LedgerDerivationPathType, PublicKeyInfo } from 'services/ledger/types'
import { showSnackbar } from 'common/utils/toast'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { isXPChain } from 'utils/network/isAvalancheNetwork'
import {
  AVALANCHE_MAINNET_NETWORK,
  NETWORK_SOLANA
} from 'services/network/consts'
import { BITCOIN_NETWORK, AVALANCHE_XP_NETWORK } from '@avalabs/core-chains-sdk'
import { ChainName } from 'services/network/consts'
import LedgerService from 'services/ledger/LedgerService'
import Logger from 'utils/Logger'
import { LedgerDeviceList } from './LedgerDeviceList'
import { AnimatedIconWithText } from './AnimatedIconWithText'

enum AppConnectionStep {
  AVALANCHE_CONNECT = 'avalanche-connect',
  AVALANCHE_LOADING = 'avalanche-loading',
  SOLANA_CONNECT = 'solana-connect',
  SOLANA_LOADING = 'solana-loading',
  COMPLETE = 'complete'
}

interface StepConfig {
  icon: React.ReactNode
  title: string
  subtitle: string
  primaryButton?: {
    text: string
    onPress: () => void
  }
  secondaryButton?: {
    text: string
    onPress: () => void
  }
  showAnimation?: boolean
  isLoading?: boolean
}

interface LedgerAppConnectionProps {
  onComplete: (keys: LocalKeyState) => void
  onCancel: () => void
  deviceName: string
  selectedDerivationPath: LedgerDerivationPathType | null
  isCreatingWallet?: boolean
  connectedDeviceId?: string | null
  connectedDeviceName?: string
  onStepChange?: (step: number) => void
}

interface LocalKeyState {
  solanaKeys: PublicKeyInfo[]
  avalancheKeys: {
    addresses: {
      evm: string
      avalanche: string
      pvm: string
    }
    xpubs: {
      evm: string
      avalanche: string
    }
  } | null
  bitcoinAddress: string
  xpAddress: string
}

export const LedgerAppConnection: React.FC<LedgerAppConnectionProps> = ({
  onComplete,
  onCancel,
  deviceName,
  selectedDerivationPath: _selectedDerivationPath,
  connectedDeviceId,
  connectedDeviceName,
  onStepChange
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const [currentStep, setCurrentStep] = useState<AppConnectionStep>(
    AppConnectionStep.AVALANCHE_CONNECT
  )

  // Local key state - managed only in this component
  const [keys, setKeys] = useState<LocalKeyState>({
    solanaKeys: [],
    avalancheKeys: null,
    bitcoinAddress: '',
    xpAddress: ''
  })

  // Handler for completing wallet creation
  const handleCompleteWallet = useCallback(() => {
    Logger.info('User clicked complete wallet button', {
      hasAvalancheKeys: !!keys.avalancheKeys,
      hasSolanaKeys: keys.solanaKeys.length > 0,
      solanaKeysCount: keys.solanaKeys.length
    })
    onComplete(keys)
  }, [keys, onComplete])

  const handleConnectAvalanche = useCallback(async () => {
    try {
      setCurrentStep(AppConnectionStep.AVALANCHE_LOADING)

      // Get keys from service
      const avalancheKeys = await LedgerService.getAvalancheKeys()
      const { bitcoinAddress, xpAddress } =
        await LedgerService.getBitcoinAndXPAddresses()

      // Update local state
      setKeys(prev => ({
        ...prev,
        avalancheKeys,
        bitcoinAddress,
        xpAddress
      }))

      // Show success toast notification
      showSnackbar('Avalanche app connected')
      // if get avalanche keys succeeds move forward to solana connect
      setCurrentStep(AppConnectionStep.SOLANA_CONNECT)
    } catch (err) {
      Logger.error('Failed to connect to Avalanche app', err)
      setCurrentStep(AppConnectionStep.AVALANCHE_CONNECT)
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Avalanche app. Please make sure the Avalanche app is open on your Ledger.',
        [{ text: 'OK' }]
      )
    }
  }, [])

  const handleConnectSolana = useCallback(async () => {
    try {
      setCurrentStep(AppConnectionStep.SOLANA_LOADING)

      // Get keys from service
      const solanaKeys = await LedgerService.getSolanaKeys()

      // Update local state
      setKeys(prev => ({
        ...prev,
        solanaKeys
      }))

      // Show success toast notification
      showSnackbar('Solana app connected')

      // Skip success step and go directly to complete
      setCurrentStep(AppConnectionStep.COMPLETE)
    } catch (err) {
      Logger.error('Failed to connect to Solana app', err)
      setCurrentStep(AppConnectionStep.SOLANA_CONNECT)
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Solana app. Please make sure the Solana app is installed and open on your Ledger.',
        [{ text: 'OK' }]
      )
    }
  }, [])

  const handleSkipSolana = useCallback(() => {
    // Skip Solana and proceed to complete step
    setCurrentStep(AppConnectionStep.COMPLETE)
  }, [])

  // Generate address list data for the complete step
  const addressListData = useMemo(() => {
    const addresses = []

    // C-Chain/EVM address (derived from avalanche keys)
    if (keys.avalancheKeys?.addresses.evm) {
      addresses.push({
        title: AVALANCHE_MAINNET_NETWORK.chainName,
        subtitle: truncateAddress(
          keys.avalancheKeys.addresses.evm,
          TRUNCATE_ADDRESS_LENGTH
        ),
        value: (
          <Icons.Navigation.Check
            color={colors.$textSuccess}
            width={24}
            height={24}
          />
        ),
        leftIcon: (
          <NetworkLogoWithChain
            network={AVALANCHE_MAINNET_NETWORK}
            networkSize={36}
            outerBorderColor={colors.$surfaceSecondary}
            showChainLogo={isXPChain(AVALANCHE_MAINNET_NETWORK.chainId)}
          />
        )
      })
    }

    // X/P Chain address
    if (keys.xpAddress) {
      const xpNetwork = {
        ...AVALANCHE_XP_NETWORK,
        chainName: ChainName.AVALANCHE_XP
      }
      addresses.push({
        title: xpNetwork.chainName,
        subtitle: truncateAddress(
          keys.xpAddress.replace(/^[XP]-/, ''),
          TRUNCATE_ADDRESS_LENGTH
        ),
        value: (
          <Icons.Navigation.Check
            color={colors.$textSuccess}
            width={24}
            height={24}
          />
        ),
        leftIcon: (
          <NetworkLogoWithChain
            network={xpNetwork}
            networkSize={36}
            outerBorderColor={colors.$surfaceSecondary}
            showChainLogo={isXPChain(xpNetwork.chainId)}
          />
        )
      })
    }

    // Bitcoin address
    if (keys.bitcoinAddress) {
      const bitcoinNetwork = {
        ...BITCOIN_NETWORK,
        chainName: ChainName.BITCOIN
      }
      addresses.push({
        title: bitcoinNetwork.chainName,
        subtitle: truncateAddress(keys.bitcoinAddress, TRUNCATE_ADDRESS_LENGTH),
        value: (
          <Icons.Navigation.Check
            color={colors.$textSuccess}
            width={24}
            height={24}
          />
        ),
        leftIcon: (
          <NetworkLogoWithChain
            network={bitcoinNetwork}
            networkSize={36}
            outerBorderColor={colors.$surfaceSecondary}
            showChainLogo={false}
          />
        )
      })
    }

    // Solana address
    if (keys.solanaKeys.length > 0 && keys.solanaKeys[0]?.key) {
      // The key is already a Solana address (Base58 encoded) from LedgerService
      const solanaAddress = keys.solanaKeys[0].key

      addresses.push({
        title: NETWORK_SOLANA.chainName,
        subtitle: truncateAddress(solanaAddress, TRUNCATE_ADDRESS_LENGTH),
        value: (
          <Icons.Navigation.Check
            color={colors.$textSuccess}
            width={24}
            height={24}
          />
        ),
        leftIcon: (
          <NetworkLogoWithChain
            network={NETWORK_SOLANA}
            networkSize={36}
            outerBorderColor={colors.$surfaceSecondary}
            showChainLogo={false}
          />
        )
      })
    }

    // Always add the "Storing wallet data" row at the end
    addresses.push({
      title: 'Storing wallet data',
      value: <LoadingState sx={{ width: 16, height: 16 }} />
    })

    return addresses
  }, [keys, colors])

  // Step configurations
  const getStepConfig = (step: AppConnectionStep): StepConfig | null => {
    switch (step) {
      case AppConnectionStep.AVALANCHE_CONNECT:
        return {
          icon: (
            <Icons.Custom.Avalanche
              width={44}
              height={40}
              color={colors.$textPrimary}
            />
          ),
          title: 'Connect to Avalanche App',
          subtitle: `Open the Avalanche app on your ${deviceName}, then press Continue when ready.`,
          primaryButton: {
            text: 'Continue',
            onPress: handleConnectAvalanche
          },
          showAnimation: false
        }

      case AppConnectionStep.AVALANCHE_LOADING:
        return {
          icon: (
            <Icons.Custom.Avalanche
              width={44}
              height={40}
              color={colors.$textPrimary}
            />
          ),
          title: 'Connecting to Avalanche app',
          subtitle: `Please keep your Avalanche app open on your ${deviceName}, We're retrieving your Avalanche addresses...`,
          showAnimation: true,
          isLoading: true
        }

      case AppConnectionStep.SOLANA_CONNECT:
        return {
          icon: (
            <Icons.Custom.Solana
              width={40}
              height={32}
              color={colors.$textPrimary}
            />
          ),
          title: 'Connect to Solana App',
          subtitle: `Close the Avalanche app and open the Solana app on your ${deviceName}, then press Continue when ready.`,
          primaryButton: {
            text: 'Continue',
            onPress: handleConnectSolana
          },
          secondaryButton: {
            text: 'Skip Solana',
            onPress: handleSkipSolana
          },
          showAnimation: false
        }

      case AppConnectionStep.SOLANA_LOADING:
        return {
          icon: (
            <Icons.Custom.Solana
              width={40}
              height={32}
              color={colors.$textPrimary}
            />
          ),
          title: 'Connecting to Solana',
          subtitle: `Please keep your Solana app open on your ${deviceName}, We're retrieving your Solana address...`,
          showAnimation: true,
          isLoading: true
        }

      default:
        return null
    }
  }

  const renderStepContent = (): React.ReactNode => {
    // Handle COMPLETE step separately as it has unique layout
    if (currentStep === AppConnectionStep.COMPLETE) {
      return (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {/* Header with refresh icon and title */}
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Icons.Notification.Sync
              color={colors.$textPrimary}
              width={75}
              height={75}
            />

            <View
              style={{ marginTop: 24, width: '100%', alignItems: 'center' }}>
              <Text
                variant="heading3"
                style={{ textAlign: 'center', marginBottom: 8 }}>
                {`Your Ledger wallet \nis being set up`}
              </Text>

              <Text
                variant="body1"
                style={{
                  textAlign: 'center',
                  color: colors.$textSecondary,
                  lineHeight: 20
                }}>
                {`Review your addresses below and press \n Complete Setup to finish wallet creation.`}
              </Text>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <GroupList data={addressListData} itemHeight={40} />
          </View>

          <View style={{ paddingBottom: 8, paddingTop: 12 }}>
            <Button type="primary" size="large" onPress={handleCompleteWallet}>
              Complete Setup
            </Button>
            <View style={{ marginTop: 12 }}>
              <Button type="tertiary" size="large" onPress={onCancel}>
                Cancel setup
              </Button>
            </View>
          </View>
        </View>
      )
    }

    // Use template for all other steps
    const config = getStepConfig(currentStep)
    if (!config) {
      return null
    }

    // Render step using inline template logic
    if (config.isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <AnimatedIconWithText
              icon={config.icon}
              title={config.title}
              subtitle={config.subtitle}
              showAnimation={config.showAnimation ?? false}
            />
          </View>

          <View>
            <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
              <View
                style={{
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 12,
                  marginBottom: 16
                }}>
                <ActivityIndicator size="small" color={colors.$textPrimary} />
              </View>

              {config.secondaryButton && (
                <Button
                  type="tertiary"
                  size="large"
                  onPress={config.secondaryButton.onPress}>
                  {config.secondaryButton.text}
                </Button>
              )}
            </View>
          </View>
        </View>
      )
    }

    // Non-loading step
    return (
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
            {config.icon}
            <Text
              variant="heading6"
              style={{
                textAlign: 'center',
                marginTop: 24,
                marginBottom: 8
              }}>
              {config.title}
            </Text>
            <Text
              variant="body1"
              style={{
                textAlign: 'center',
                color: colors.$textSecondary,
                maxWidth: 280
              }}>
              {config.subtitle}
            </Text>
          </View>
        </View>

        <View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
            {config.primaryButton && (
              <Button
                type="primary"
                size="large"
                onPress={config.primaryButton.onPress}
                style={{ marginBottom: 16 }}>
                {config.primaryButton.text}
              </Button>
            )}

            {config.secondaryButton && (
              <Button
                type="tertiary"
                size="large"
                onPress={config.secondaryButton.onPress}>
                {config.secondaryButton.text}
              </Button>
            )}
          </View>
        </View>
      </View>
    )
  }

  const progressDotsCurrentStep = useMemo(() => {
    switch (currentStep) {
      case AppConnectionStep.AVALANCHE_CONNECT:
      case AppConnectionStep.AVALANCHE_LOADING:
        return 0

      case AppConnectionStep.SOLANA_CONNECT:
      case AppConnectionStep.SOLANA_LOADING:
        return 1

      case AppConnectionStep.COMPLETE:
        return 2

      default:
        return 0
    }
  }, [currentStep])

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(progressDotsCurrentStep)
  }, [progressDotsCurrentStep, onStepChange])

  // Create device object for display
  const connectedDevice = connectedDeviceId
    ? [{ id: connectedDeviceId, name: connectedDeviceName || deviceName }]
    : []

  return (
    <View style={{ flex: 1 }}>
      {/* Show connected device */}
      {connectedDevice.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <LedgerDeviceList
            devices={connectedDevice}
            subtitleText="Connected via Bluetooth"
            testID="connected_device_list"
          />
        </View>
      )}

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {renderStepContent()}
      </View>
    </View>
  )
}
