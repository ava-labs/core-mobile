import { ActivityIndicator, Button, ButtonType } from '@avalabs/k2-alpine'
import { ProgressDots } from 'common/components/ProgressDots'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { showSnackbar } from 'common/utils/toast'
import {
  AppConnectionStep,
  LedgerAppConnection
} from 'new/features/ledger/components/LedgerAppConnection'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import { Alert, Platform, View } from 'react-native'
import { useSelector } from 'react-redux'
import {
  isLedgerBluetoothError,
  showBluetoothErrorAlert
} from 'services/ledger/LedgerBluetoothError'
import LedgerService from 'services/ledger/LedgerService'
import {
  AvalancheKey,
  LedgerDerivationPathType,
  LedgerKeys,
  LedgerKeysByNetwork,
  LedgerMultiIndexKeys,
  MAX_LEDGER_DISCOVERY_ACCOUNTS
} from 'services/ledger/types'
import {
  deriveAddressesFromXpub,
  deriveAddressesFromPublicKeys
} from 'services/ledger/deriveAddressesOffline'
import { bip32 } from 'utils/bip32'
import { Curve } from 'utils/publicKeys'
import { isLedgerBluetoothPermissionError } from 'services/ledger/LedgerBluetoothPermissionError'
import { selectIsSolanaSupportBlocked } from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import Logger from 'utils/Logger'

export default function AppConnectionScreen({
  selectedDerivationPath = LedgerDerivationPathType.BIP44,
  completeStepTitle,
  isUpdatingWallet,
  handleComplete,
  deviceId,
  deviceName = 'Ledger Device',
  handleCancel,
  accountIndex,
  showProgressDots = true,
  showConnectionToasts,
  showCancelOnComplete
}: {
  selectedDerivationPath?: LedgerDerivationPathType
  completeStepTitle: string
  isUpdatingWallet: boolean
  deviceId?: string | null
  deviceName?: string
  handleCancel: () => Promise<void>
  handleComplete: (keys: LedgerMultiIndexKeys) => Promise<void>
  accountIndex: number
  showProgressDots?: boolean
  showConnectionToasts: boolean
  showCancelOnComplete: boolean
}): JSX.Element {
  const headerHeight = useEffectiveHeaderHeight()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)

  const hasDeviceId = !!deviceId

  // Local key state - managed only in this component
  const [multiIndexKeys, setMultiIndexKeys] = useState<LedgerMultiIndexKeys>({
    mainnet: {},
    testnet: {}
  })

  const [currentAppConnectionStep, setAppConnectionStep] =
    useState<AppConnectionStep>(AppConnectionStep.AVALANCHE_CONNECT)
  const [skipSolana, setSkipSolana] = useState(false)

  const progressDotsCurrentStep = useMemo(() => {
    if (isSolanaSupportBlocked) {
      // If Solana support is blocked, skip Solana step in progress dots
      switch (currentAppConnectionStep) {
        case AppConnectionStep.AVALANCHE_CONNECT:
        case AppConnectionStep.AVALANCHE_LOADING:
          return 0

        case AppConnectionStep.COMPLETE:
          return 1

        default:
          return 0
      }
    }

    switch (currentAppConnectionStep) {
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
  }, [currentAppConnectionStep, isSolanaSupportBlocked])

  // Cleanup: Stop polling when component unmounts
  useEffect(() => {
    return () => {
      Logger.info('AppConnectionScreen unmounting, stopping app polling')
      LedgerService.stopAppPolling()
    }
  }, [])

  const headerCenterOverlay = useMemo(() => {
    if (!showProgressDots) return undefined

    const paddingTop = Platform.OS === 'ios' ? 15 : 50

    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: headerHeight
        }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop
          }}>
          <ProgressDots
            totalSteps={isSolanaSupportBlocked ? 2 : 3}
            currentStep={progressDotsCurrentStep}
          />
        </View>
      </View>
    )
  }, [
    showProgressDots,
    headerHeight,
    isSolanaSupportBlocked,
    progressDotsCurrentStep
  ])

  const handleConnectAvalanche = useCallback(async () => {
    try {
      if (!deviceId) {
        throw new Error('No device ID found')
      }
      await LedgerService.ensureConnection(deviceId)
      setAppConnectionStep(AppConnectionStep.AVALANCHE_LOADING)

      const count = isUpdatingWallet ? 1 : MAX_LEDGER_DISCOVERY_ACCOUNTS
      const isBIP44 = selectedDerivationPath === LedgerDerivationPathType.BIP44
      // When adding a single account to an existing wallet, use the provided
      // accountIndex (e.g. 2 for the third account). For discovery during
      // import, always start from 0.
      const startIndex = isUpdatingWallet ? accountIndex : 0

      const mainnetKeys: LedgerMultiIndexKeys['mainnet'] = {}
      const testnetKeys: LedgerMultiIndexKeys['testnet'] = {}

      // --- First account: full device flow (one network) for display addresses ---
      const firstAccountKeys = await LedgerService.getAvalancheKeys(
        startIndex,
        isDeveloperMode,
        selectedDerivationPath
      )

      // Derive account 0's opposite-network addresses offline from xpubs/pubkeys
      const firstAccountOppositeAddresses = isBIP44
        ? deriveAddressesFromXpub(
            firstAccountKeys.xpubs.evm,
            firstAccountKeys.xpubs.avalanche,
            !isDeveloperMode
          )
        : deriveAddressesFromPublicKeys(
            firstAccountKeys.publicKeys[0]?.key ?? '',
            firstAccountKeys.publicKeys[1]?.key ?? '',
            !isDeveloperMode
          )

      const firstAccountOppositeAvalancheKey: AvalancheKey = {
        addresses: firstAccountOppositeAddresses,
        xpubs: firstAccountKeys.xpubs,
        publicKeys: firstAccountKeys.publicKeys
      }

      const firstAccountCurrent: LedgerKeys = {
        avalancheKeys: firstAccountKeys,
        solanaKeys: []
      }
      const firstAccountOpposite: LedgerKeys = {
        avalancheKeys: firstAccountOppositeAvalancheKey,
        solanaKeys: []
      }

      mainnetKeys[startIndex] = isDeveloperMode
        ? firstAccountOpposite
        : firstAccountCurrent
      testnetKeys[startIndex] = isDeveloperMode
        ? firstAccountCurrent
        : firstAccountOpposite

      // --- Accounts 1-9: minimal device calls + offline derivation ---
      if (count > 1) {
        if (isBIP44) {
          // BIP44: fetch only xpubs (2 APDU per account instead of 5)
          const xpubRange = await LedgerService.getExtendedPublicKeysForRange(
            1,
            count - 1
          )

          // For EVM, all accounts share the account-level xpub from index 0.
          // Different accounts are at address indices 0/{N} within that xpub.
          const evmAccount0Xpub = firstAccountKeys.xpubs.evm

          for (let i = 0; i < xpubRange.length; i++) {
            const xpubs = xpubRange[i]
            if (!xpubs) continue

            const idx = i + 1
            // For storage, we still store the per-index xpub from the device
            const perIndexEvmXpub = bip32
              .fromPublicKey(
                Buffer.from(xpubs.evm.key, 'hex'),
                Buffer.from(xpubs.evm.chainCode, 'hex')
              )
              .toBase58()
            const avalancheXpub = bip32
              .fromPublicKey(
                Buffer.from(xpubs.avalanche.key, 'hex'),
                Buffer.from(xpubs.avalanche.chainCode, 'hex')
              )
              .toBase58()

            // Use account 0's EVM xpub with address index for correct derivation
            const mainnetAddresses = deriveAddressesFromXpub(
              evmAccount0Xpub,
              avalancheXpub,
              false,
              idx
            )
            const testnetAddresses = deriveAddressesFromXpub(
              evmAccount0Xpub,
              avalancheXpub,
              true,
              idx
            )

            // Derive address-level public keys for storage
            // EVM: use account 0 xpub with correct address index
            const evmPubKey = bip32
              .fromBase58(evmAccount0Xpub)
              .derive(0)
              .derive(idx)
              .publicKey?.toString('hex') ?? ''
            const avalanchePubKey = bip32
              .fromBase58(avalancheXpub)
              .derive(0)
              .derive(0)
              .publicKey?.toString('hex') ?? ''

            const evmPath = `m/44'/60'/${idx}'/0/0`
            const avalanchePath = `m/44'/9000'/${idx}'/0/0`

            const publicKeys = [
              { key: evmPubKey, derivationPath: evmPath, curve: Curve.SECP256K1 },
              { key: avalanchePubKey, derivationPath: avalanchePath, curve: Curve.SECP256K1 }
            ]

            mainnetKeys[idx] = {
              avalancheKeys: {
                addresses: mainnetAddresses,
                xpubs: { evm: evmAccount0Xpub, avalanche: avalancheXpub },
                publicKeys
              },
              solanaKeys: []
            }
            testnetKeys[idx] = {
              avalancheKeys: {
                addresses: testnetAddresses,
                xpubs: { evm: evmAccount0Xpub, avalanche: avalancheXpub },
                publicKeys
              },
              solanaKeys: []
            }
          }
        } else {
          // LedgerLive: fetch only public keys (2 APDU per account)
          const pubKeyRange = await LedgerService.getPublicKeysForRange(
            1,
            count - 1
          )

          for (let i = 0; i < pubKeyRange.length; i++) {
            const keys = pubKeyRange[i]
            if (!keys) continue

            const idx = i + 1
            const mainnetAddresses = deriveAddressesFromPublicKeys(
              keys.evmPubKey,
              keys.avalanchePubKey,
              false
            )
            const testnetAddresses = deriveAddressesFromPublicKeys(
              keys.evmPubKey,
              keys.avalanchePubKey,
              true
            )

            const publicKeys = [
              { key: keys.evmPubKey, derivationPath: keys.evmPath, curve: Curve.SECP256K1 },
              { key: keys.avalanchePubKey, derivationPath: keys.avalanchePath, curve: Curve.SECP256K1 }
            ]

            mainnetKeys[idx] = {
              avalancheKeys: {
                addresses: mainnetAddresses,
                xpubs: { evm: '', avalanche: '' },
                publicKeys
              },
              solanaKeys: []
            }
            testnetKeys[idx] = {
              avalancheKeys: {
                addresses: testnetAddresses,
                xpubs: { evm: '', avalanche: '' },
                publicKeys
              },
              solanaKeys: []
            }
          }
        }
      }

      setMultiIndexKeys({ mainnet: mainnetKeys, testnet: testnetKeys })

      if (showConnectionToasts) showSnackbar('Avalanche app connected')
      setAppConnectionStep(
        isSolanaSupportBlocked
          ? AppConnectionStep.COMPLETE
          : AppConnectionStep.SOLANA_CONNECT
      )
    } catch (err) {
      Logger.error('Failed to connect to Avalanche app', err)
      setAppConnectionStep(AppConnectionStep.AVALANCHE_CONNECT)
      if (isLedgerBluetoothError(err)) {
        showBluetoothErrorAlert(err)
        return
      }
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Avalanche app. Please make sure the Avalanche app is open on your Ledger.',
        [{ text: 'OK' }]
      )
    }
  }, [
    accountIndex,
    deviceId,
    isDeveloperMode,
    isSolanaSupportBlocked,
    isUpdatingWallet,
    selectedDerivationPath,
    showConnectionToasts
  ])

  const handleConnectSolana = useCallback(async () => {
    try {
      if (!deviceId) {
        throw new Error('No device ID found')
      }
      await LedgerService.ensureConnection(deviceId)
      setAppConnectionStep(AppConnectionStep.SOLANA_LOADING)

      // Get keys from service
      const count = isUpdatingWallet ? 1 : MAX_LEDGER_DISCOVERY_ACCOUNTS
      const solanaKeysRange = await LedgerService.getSolanaKeysForRange(count)

      // Update local state
      setMultiIndexKeys(prev => {
        const updatedMainnet = { ...prev.mainnet }
        const updatedTestnet = { ...prev.testnet }
        for (let i = 0; i < count; i++) {
          const solKeys = solanaKeysRange[i] ?? []
          if (updatedMainnet[i])
            updatedMainnet[i] = { ...updatedMainnet[i], solanaKeys: solKeys }
          if (updatedTestnet[i])
            updatedTestnet[i] = { ...updatedTestnet[i], solanaKeys: solKeys }
        }
        return { mainnet: updatedMainnet, testnet: updatedTestnet }
      })

      // Show success toast notification
      if (showConnectionToasts) showSnackbar('Solana app connected')

      // Skip success step and go directly to complete
      setAppConnectionStep(AppConnectionStep.COMPLETE)
    } catch (err) {
      Logger.error('Failed to connect to Solana app', err)
      setAppConnectionStep(AppConnectionStep.SOLANA_CONNECT)
      if (isLedgerBluetoothError(err)) {
        showBluetoothErrorAlert(err)
        return
      }
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Solana app. Please make sure the Solana app is installed and open on your Ledger.',
        [{ text: 'OK' }]
      )
    }
  }, [deviceId, isUpdatingWallet, showConnectionToasts])

  const handleSkipSolana = useCallback(() => {
    // Skip Solana and proceed to complete step
    setSkipSolana(true)
    setAppConnectionStep(AppConnectionStep.COMPLETE)
  }, [setAppConnectionStep])

  const renderFooter = useCallback(() => {
    let primary: {
      text: string | ReactNode
      onPress?: () => void
      disable?: boolean
    } = {
      text: 'Continue'
    }
    let secondary:
      | {
          text: string
          onPress?: () => void
          type?: ButtonType
          disable?: boolean
        }
      | undefined

    switch (currentAppConnectionStep) {
      case AppConnectionStep.AVALANCHE_CONNECT:
      case AppConnectionStep.AVALANCHE_LOADING:
        primary = {
          text: 'Continue',
          onPress: handleConnectAvalanche,
          disable:
            currentAppConnectionStep === AppConnectionStep.AVALANCHE_LOADING ||
            hasDeviceId === false
        }
        break
      case AppConnectionStep.SOLANA_CONNECT:
      case AppConnectionStep.SOLANA_LOADING:
        primary = {
          text: 'Continue',
          onPress: handleConnectSolana,
          disable:
            currentAppConnectionStep === AppConnectionStep.SOLANA_LOADING ||
            hasDeviceId === false
        }
        secondary = {
          text: 'Skip Solana',
          onPress: handleSkipSolana,
          type: 'secondary'
        }
        break
      case AppConnectionStep.COMPLETE:
        primary = {
          text: isUpdatingWallet ? <ActivityIndicator /> : 'Complete setup',
          onPress: () => handleComplete(multiIndexKeys),
          disable: isUpdatingWallet
        }
        if (showCancelOnComplete) {
          secondary = {
            text: 'Cancel',
            onPress: handleCancel,
            disable: isUpdatingWallet
          }
        }
        break
    }

    return (
      <View style={{ gap: 12 }}>
        <Button
          type="primary"
          size="large"
          onPress={primary?.onPress}
          disabled={primary?.disable}>
          {primary?.text}
        </Button>
        {secondary && (
          <Button
            type={secondary?.type ?? 'tertiary'}
            disabled={secondary?.disable}
            size="large"
            onPress={secondary?.onPress}>
            {secondary?.text}
          </Button>
        )}
      </View>
    )
  }, [
    currentAppConnectionStep,
    handleCancel,
    handleComplete,
    handleConnectAvalanche,
    handleConnectSolana,
    handleSkipSolana,
    hasDeviceId,
    isUpdatingWallet,
    multiIndexKeys,
    showCancelOnComplete
  ])

  // For display, show the first available account's keys (index 0 during import,
  // or the specific accountIndex when adding a single account)
  const emptyKeys = { solanaKeys: [], avalancheKeys: undefined }
  const firstMainnetKey = Object.values(multiIndexKeys.mainnet)[0]
  const firstTestnetKey = Object.values(multiIndexKeys.testnet)[0]
  const displayKeys: LedgerKeysByNetwork = {
    mainnet: firstMainnetKey ?? emptyKeys,
    testnet: firstTestnetKey ?? emptyKeys
  }

  return (
    <ScrollScreen
      headerCenterOverlay={headerCenterOverlay}
      showNavigationHeaderTitle={false}
      hasParent={true}
      isModal={true}
      style={{ paddingTop: 8 }}
      renderFooter={renderFooter}
      contentContainerStyle={{
        flex:
          currentAppConnectionStep === AppConnectionStep.COMPLETE
            ? undefined
            : 1
      }}>
      <LedgerAppConnection
        completeStepTitle={completeStepTitle}
        connectedDeviceId={deviceId}
        connectedDeviceName={deviceName}
        keys={displayKeys}
        appConnectionStep={currentAppConnectionStep}
        skipSolana={skipSolana}
      />
    </ScrollScreen>
  )
}
