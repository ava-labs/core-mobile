import React, { useCallback, useMemo } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Text, useTheme, Icons, GroupList } from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { LedgerKeys } from 'services/ledger/types'
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
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import { useSelector } from 'react-redux'
import { LedgerDeviceList } from './LedgerDeviceList'
import { AnimatedIconWithText } from './AnimatedIconWithText'

export enum AppConnectionStep {
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
  showAnimation?: boolean
  isLoading?: boolean
}

interface LedgerAppConnectionProps {
  completeStepTitle: string
  connectedDeviceId?: string | null
  connectedDeviceName?: string
  keys?: LedgerKeys
  appConnectionStep: AppConnectionStep
  skipSolana?: boolean
  onlySolana?: boolean
}

export const LedgerAppConnection: React.FC<LedgerAppConnectionProps> = ({
  completeStepTitle,
  connectedDeviceId,
  connectedDeviceName,
  keys,
  appConnectionStep: currentStep,
  skipSolana,
  onlySolana = false
}) => {
  const {
    theme: { colors }
  } = useTheme()
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)

  const hasAllKeys = useMemo(() => {
    return (
      !!keys?.avalancheKeys &&
      keys?.bitcoinAddress !== '' &&
      keys?.xpAddress !== '' &&
      (isSolanaSupportBlocked ||
        skipSolana ||
        (keys?.solanaKeys && keys.solanaKeys.length > 0))
    )
  }, [
    isSolanaSupportBlocked,
    keys?.avalancheKeys,
    keys?.bitcoinAddress,
    keys?.solanaKeys,
    keys?.xpAddress,
    skipSolana
  ])

  // Generate address list data for the complete step
  const addressListData = useMemo(() => {
    const addresses = []

    // C-Chain/EVM address (derived from avalanche keys)
    if (keys?.avalancheKeys?.addresses.evm) {
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
    if (keys?.xpAddress) {
      const xpNetwork = {
        ...AVALANCHE_XP_NETWORK,
        chainName: ChainName.AVALANCHE_XP
      }
      addresses.push({
        title: xpNetwork.chainName,
        subtitle: truncateAddress(
          stripAddressPrefix(keys.xpAddress),
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
    if (keys?.bitcoinAddress) {
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
    if (
      keys?.solanaKeys &&
      keys?.solanaKeys.length > 0 &&
      keys?.solanaKeys[0]?.key
    ) {
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
      value: hasAllKeys ? (
        <Icons.Navigation.Check
          color={colors.$textSuccess}
          width={24}
          height={24}
        />
      ) : (
        <LoadingState sx={{ width: 16, height: 16 }} />
      )
    })

    return addresses
  }, [
    keys?.avalancheKeys?.addresses.evm,
    keys?.xpAddress,
    keys?.bitcoinAddress,
    keys?.solanaKeys,
    hasAllKeys,
    colors.$textSuccess,
    colors.$surfaceSecondary
  ])

  // Step configurations
  const getStepConfig = useCallback(
    (step: AppConnectionStep): StepConfig | null => {
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
            subtitle: `Open the Avalanche app on your ${connectedDeviceName}, then press Continue when ready.`,
            showAnimation: false,
            isLoading: !connectedDeviceId
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
            subtitle: `Please keep your Avalanche app open on your ${connectedDeviceName}, We're retrieving your Avalanche addresses...`,
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
            subtitle: onlySolana
              ? `Open the Solana app on your ${connectedDeviceName}, then press Continue when ready.`
              : `Close the Avalanche app and open the Solana app on your ${connectedDeviceName}, then press Continue when ready.`,
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
            subtitle: `Please keep your Solana app open on your ${connectedDeviceName}, We're retrieving your Solana address...`,
            showAnimation: true,
            isLoading: true
          }

        default:
          return null
      }
    },
    [colors.$textPrimary, connectedDeviceId, connectedDeviceName, onlySolana]
  )

  const renderStepContent = useCallback((): React.ReactNode => {
    // Handle COMPLETE step separately as it has unique layout
    if (currentStep === AppConnectionStep.COMPLETE) {
      return (
        <View style={{ flex: 1 }}>
          {/* Header with refresh icon and title */}
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Icons.Notification.SyncV2
              color={colors.$textPrimary}
              width={41}
              height={41}
            />

            <View
              style={{ marginTop: 24, width: '100%', alignItems: 'center' }}>
              <Text
                variant="heading3"
                style={{ textAlign: 'center', marginBottom: 8 }}>
                {completeStepTitle}
              </Text>

              <View style={{ paddingHorizontal: 16 }}>
                <Text
                  variant="body1"
                  style={{
                    textAlign: 'center',
                    color: colors.$textPrimary,
                    lineHeight: 20
                  }}>
                  {`The BIP44 setup is in progress and should take about 15 seconds. Keep your device connected during setup.`}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <GroupList data={addressListData} itemHeight={40} />
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
              subtitleStyle={{ fontSize: 12 }}
              showAnimation={config.showAnimation ?? false}
            />
          </View>

          <View>
            <View style={{ paddingHorizontal: 16 }}>
              <View
                style={{
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 12,
                  marginBottom: 16
                }}>
                <ActivityIndicator size="large" color={colors.$textPrimary} />
              </View>
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
                maxWidth: 280,
                fontSize: 12
              }}>
              {config.subtitle}
            </Text>
          </View>
        </View>
      </View>
    )
  }, [
    addressListData,
    colors.$textPrimary,
    colors.$textSecondary,
    completeStepTitle,
    currentStep,
    getStepConfig
  ])

  // Create device object for display
  const connectedDevice = connectedDeviceId
    ? [{ id: connectedDeviceId, name: connectedDeviceName ?? 'Ledger Device' }]
    : []

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      {/* Show connected device */}
      {connectedDevice.length > 0 && (
        <LedgerDeviceList
          devices={connectedDevice}
          subtitleText="Connected via Bluetooth"
          testID="connected_device_list"
        />
      )}

      {renderStepContent()}
    </View>
  )
}
