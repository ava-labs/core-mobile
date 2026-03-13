import {
  ActivityIndicator,
  Button,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { OnDelegationProgress } from 'contexts/DelegationContext'
import { LEDGER_DEVICE_BRIEF_DELAY_MS } from 'features/ledger/consts'
import { AnimatedIconWithText } from 'features/ledger/components/AnimatedIconWithText'
import { useLedgerWalletMap } from 'features/ledger/store'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import LedgerService from 'services/ledger/LedgerService'
import { LedgerAppType } from 'services/ledger/types'
import { Operation } from 'services/earn/computeDelegationSteps/types'
import { selectActiveWalletId } from 'store/wallet/slice'

type LedgerPhase = 'idle' | 'connecting' | 'progress'

type UseLedgerStakingReturn = {
  startLedgerDelegation: (
    action: (onProgress?: OnDelegationProgress) => void
  ) => void
  resetLedgerState: () => void
  renderLedgerFooter: (totalSteps: number) => JSX.Element | null
}

export const useLedgerStaking = (isLedger: boolean): UseLedgerStakingReturn => {
  const { theme } = useTheme()
  const [ledgerPhase, setLedgerPhase] = useState<LedgerPhase>('idle')
  const [isLedgerConnected, setIsLedgerConnected] = useState(false)
  const [isAvalancheAppOpen, setIsAvalancheAppOpen] = useState(false)
  const [ledgerCurrentStep, setLedgerCurrentStep] = useState(0)
  const [ledgerCurrentOperation, setLedgerCurrentOperation] =
    useState<Operation | null>(null)
  const [approvalInProgress, setApprovalInProgress] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const pendingActionRef = useRef<
    ((onProgress?: OnDelegationProgress) => void) | undefined
  >(undefined)

  const activeWalletId = useSelector(selectActiveWalletId)
  const { getLedgerInfoByWalletId } = useLedgerWalletMap()
  const deviceForWallet = useMemo(
    () => getLedgerInfoByWalletId(activeWalletId)?.device,
    [getLedgerInfoByWalletId, activeWalletId]
  )

  const handleReconnect = useCallback(async (): Promise<void> => {
    if (!deviceForWallet) return
    setIsConnecting(true)
    try {
      await LedgerService.ensureConnection(deviceForWallet.id)
      setIsLedgerConnected(true)
    } catch {
      setIsLedgerConnected(false)
    } finally {
      setIsConnecting(false)
    }
  }, [deviceForWallet])

  // Initiate BLE connection when entering connecting phase
  useEffect(() => {
    if (!isLedger || ledgerPhase !== 'connecting' || !deviceForWallet) return

    handleReconnect()
  }, [isLedger, ledgerPhase, deviceForWallet, handleReconnect])

  // Poll for device connection and Avalanche app status
  useEffect(() => {
    if (!isLedger || ledgerPhase !== 'connecting') return

    const checkDeviceReady = async (): Promise<void> => {
      try {
        const connected = LedgerService.isConnected()
        setIsLedgerConnected(connected)
        if (connected) {
          const appType = LedgerService.getCurrentAppType()
          setIsAvalancheAppOpen(appType === LedgerAppType.AVALANCHE)
        } else {
          setIsAvalancheAppOpen(false)
        }
      } catch {
        setIsLedgerConnected(false)
        setIsAvalancheAppOpen(false)
      }
    }

    checkDeviceReady()
    const pollInterval = setInterval(
      checkDeviceReady,
      LEDGER_DEVICE_BRIEF_DELAY_MS
    )
    return () => clearInterval(pollInterval)
  }, [isLedger, ledgerPhase])

  // Start delegation once device is connected and Avalanche app is open
  useEffect(() => {
    if (
      ledgerPhase !== 'connecting' ||
      !isLedgerConnected ||
      !isAvalancheAppOpen ||
      approvalInProgress
    )
      return

    setApprovalInProgress(true)
    setLedgerPhase('progress')

    const onProgress: OnDelegationProgress = (
      step: number,
      operation: Operation | null
    ): void => {
      setLedgerCurrentStep(step + 1) // Convert to 1-based index for user display
      setLedgerCurrentOperation(operation)
    }

    pendingActionRef.current?.(onProgress)
  }, [ledgerPhase, isLedgerConnected, isAvalancheAppOpen, approvalInProgress])

  const startLedgerDelegation = (
    action: (onProgress?: OnDelegationProgress) => void
  ): void => {
    pendingActionRef.current = action
    setLedgerPhase('connecting')
    setIsLedgerConnected(false)
    setIsAvalancheAppOpen(false)
    setLedgerCurrentStep(0)
    setLedgerCurrentOperation(null)
    setApprovalInProgress(false)
  }

  const resetLedgerState = (): void => {
    setLedgerPhase('idle')
    setApprovalInProgress(false)
  }

  const connectionStatus = useMemo((): string => {
    if (!isLedgerConnected) {
      return deviceForWallet
        ? `Connect ${deviceForWallet.name} and open the Avalanche app`
        : 'Connect your Ledger and open the Avalanche app'
    }
    if (!isAvalancheAppOpen) {
      return deviceForWallet
        ? `Open the Avalanche app on ${deviceForWallet.name}`
        : 'Open the Avalanche app on your Ledger'
    }
    return 'Ready — starting transaction...'
  }, [isLedgerConnected, isAvalancheAppOpen, deviceForWallet])

  const stepConfig = useMemo(() => {
    switch (ledgerCurrentOperation) {
      case Operation.EXPORT_C:
        return {
          title: 'Export from C-Chain',
          subtitle: 'Sign the export transaction on your Ledger device'
        }
      case Operation.IMPORT_P:
        return {
          title: 'Import to P-Chain',
          subtitle: 'Sign the import transaction on your Ledger device'
        }
      case Operation.DELEGATE:
        return {
          title: 'Delegate Stake',
          subtitle: 'Sign the delegation transaction on your Ledger device'
        }
      case Operation.EXPORT_P:
        return {
          title: 'Export from P-Chain',
          subtitle: 'Sign the export transaction on your Ledger device'
        }
      case Operation.IMPORT_C:
        return {
          title: 'Import to C-Chain',
          subtitle: 'Sign the import transaction on your Ledger device'
        }
      default:
        return {
          title: 'Preparing transaction...',
          subtitle: 'Please wait while we prepare your staking transaction'
        }
    }
  }, [ledgerCurrentOperation])

  const renderLedgerFooter = (totalSteps: number): JSX.Element | null => {
    if (!isLedger) return null

    if (ledgerPhase === 'connecting') {
      return (
        <View sx={{ gap: 16 }}>
          {deviceForWallet && (
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.$surfaceSecondary,
                gap: 16,
                borderRadius: 12,
                paddingHorizontal: 16
              }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.$surfaceSecondary,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                <Icons.Custom.Bluetooth
                  color={theme.colors.$textPrimary}
                  width={24}
                  height={24}
                />
              </View>
              <View
                sx={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12
                }}>
                <View sx={{ marginVertical: 14, flex: 1, flexShrink: 1 }}>
                  <Text
                    numberOfLines={1}
                    variant="buttonMedium"
                    sx={{
                      fontFamily: 'Inter-Medium',
                      fontSize: 16,
                      color: '$textPrimary'
                    }}>
                    {deviceForWallet.name}
                  </Text>
                  <Text
                    numberOfLines={2}
                    variant="caption"
                    sx={{
                      fontSize: 13,
                      paddingTop: 4,
                      color: theme.colors.$textSecondary
                    }}>
                    {connectionStatus}
                  </Text>
                </View>
                <View
                  sx={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    flexShrink: 0
                  }}>
                  {!isLedgerConnected && (
                    <Button
                      type="primary"
                      size="small"
                      style={{ width: 72 }}
                      onPress={handleReconnect}
                      disabled={isConnecting}>
                      {isConnecting ? (
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.$surfacePrimary}
                        />
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  )}
                </View>
              </View>
            </View>
          )}
          <Button
            type="tertiary"
            size="large"
            onPress={() => setLedgerPhase('idle')}>
            Cancel
          </Button>
        </View>
      )
    }

    if (ledgerPhase === 'progress') {
      const title = stepConfig.title.includes('Preparing')
        ? stepConfig.title
        : `${stepConfig.title} [${ledgerCurrentStep}/${totalSteps}]`
      return (
        <AnimatedIconWithText
          icon={
            <Icons.Custom.Ledger
              color={theme.colors.$textPrimary}
              width={32}
              height={32}
            />
          }
          animationSize={{ width: 120, height: 120 }}
          title={title}
          titleStyle={{ fontSize: 16 }}
          subtitle={stepConfig.subtitle}
          subtitleStyle={{ fontSize: 12 }}
          showAnimation
        />
      )
    }

    return null
  }

  return {
    startLedgerDelegation,
    resetLedgerState,
    renderLedgerFooter
  }
}
