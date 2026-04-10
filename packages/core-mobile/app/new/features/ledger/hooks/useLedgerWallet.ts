import { showSnackbar } from 'new/common/utils/toast'
import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  LedgerDerivationPathType,
  LedgerKeys,
  LedgerMultiIndexKeys,
  PublicKeyInfo,
  WalletCreationOptions,
  WalletSecretOperation,
  WalletUpdateOptions,
  WalletUpdateSolanaOptions
} from 'services/ledger/types'
import { WalletType } from 'services/wallet/types'
import { PrimaryAccount, setAccount, setActiveAccountId } from 'store/account'
import { selectWalletState } from 'store/app'
import { WalletState } from 'store/app/types'
import { AppThunkDispatch } from 'store/types'
import { setActiveWallet } from 'store/wallet/slice'
import { storeWallet } from 'store/wallet/thunks'
import Logger from 'utils/Logger'
import { uuid } from 'utils/uuid'
import { CoreAccountType } from '@avalabs/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  LedgerWalletSecretSchema,
  buildLedgerWalletSecret,
  buildKeysFromMultiIndex,
  getFormattedAddresses
} from '../utils'
import { useLedgerWalletMap } from '../store'

export interface UseLedgerWalletReturn {
  isLoading: boolean

  // Methods
  createLedgerWallet: (
    options: WalletCreationOptions &
      LedgerKeys & {
        additionalXpubs?: Record<number, { evm: string; avalanche: string }>
        additionalPublicKeys?: Record<number, PublicKeyInfo[]>
        additionalSolanaAddresses?: Record<number, string>
      }
  ) => Promise<{ walletId: string; accountId: string }>
  updateSolanaForLedgerWallet: (
    options: WalletUpdateSolanaOptions
  ) => Promise<void>
  createLedgerAccount: (
    options: WalletUpdateOptions & LedgerKeys
  ) => Promise<{ walletId: string; accountId: string }>
  createLedgerWalletWithDiscovery: (options: {
    deviceId: string
    deviceName: string
    derivationPathType: LedgerDerivationPathType
    multiIndexKeys: LedgerMultiIndexKeys
    activeIndices: number[]
  }) => Promise<{
    walletId: string
    createdAccounts: Array<{ accountId: string; accountIndex: number }>
  }>
}

export function useLedgerWallet(): UseLedgerWalletReturn {
  const { setLedgerWalletMap } = useLedgerWalletMap()
  const dispatch = useDispatch<AppThunkDispatch>()
  const walletState = useSelector(selectWalletState)
  const [isLoading, setIsLoading] = useState(false)

  const createLedgerWallet = useCallback(
    async ({
      deviceId,
      deviceName = 'Ledger',
      derivationPathType = LedgerDerivationPathType.BIP44,
      avalancheKeys,
      solanaKeys = [],
      additionalXpubs,
      additionalPublicKeys,
      additionalSolanaAddresses
    }: WalletCreationOptions &
      LedgerKeys & {
        additionalXpubs?: Record<number, { evm: string; avalanche: string }>
        additionalPublicKeys?: Record<number, PublicKeyInfo[]>
        additionalSolanaAddresses?: Record<number, string>
      }) => {
      try {
        setIsLoading(true)

        Logger.info(
          `Creating ${derivationPathType} Ledger wallet with generated keys...`
        )

        if (!avalancheKeys) {
          throw new Error('Missing Avalanche keys for wallet creation')
        }

        // Solana keys are optional - wallet can be created with only Avalanche keys

        const newWalletId = uuid()

        const { addresses, xpubs, publicKeys } = avalancheKeys
        const formattedAddresses = getFormattedAddresses(addresses)

        await dispatch(
          storeWallet({
            walletId: newWalletId,
            name: deviceName,
            walletSecret: buildLedgerWalletSecret({
              type: WalletSecretOperation.NEW,
              deviceId,
              deviceName,
              derivationPathType,
              extendedPublicKeys: {
                0: { evm: xpubs.evm, avalanche: xpubs.avalanche },
                ...(additionalXpubs ?? {})
              },
              publicKeys: {
                0: [
                  ...publicKeys,
                  ...(solanaKeys?.length > 0 ? [solanaKeys[0]] : [])
                ].filter(Boolean) as PublicKeyInfo[],
                ...(additionalPublicKeys ?? {})
              },
              solanaAddresses: additionalSolanaAddresses
            }),
            type:
              derivationPathType === LedgerDerivationPathType.BIP44
                ? WalletType.LEDGER
                : WalletType.LEDGER_LIVE
          })
        ).unwrap()

        setLedgerWalletMap(
          newWalletId,
          { id: deviceId, name: deviceName || 'Ledger' },
          derivationPathType
        )

        dispatch(setActiveWallet(newWalletId))

        // For the first account (index 0), use the addresses we retrieved during setup
        // This avoids the complex derivation logic that returns empty addresses
        const newAccountId = uuid()
        const newAccount: PrimaryAccount = {
          id: newAccountId,
          walletId: newWalletId,
          name: `Account 1`,
          type: CoreAccountType.PRIMARY,
          index: 0,
          addressC: formattedAddresses.evm,
          addressBTC: formattedAddresses.btc,
          addressAVM: formattedAddresses.avm,
          addressPVM: formattedAddresses.pvm,
          addressSVM: solanaKeys[0]?.key || '',
          addressCoreEth: formattedAddresses.coreEth
        }

        dispatch(setAccount(newAccount))
        dispatch(setActiveAccountId(newAccountId))

        Logger.info('Ledger wallet created successfully:', newWalletId)
        AnalyticsService.capture(
          walletState === WalletState.NONEXISTENT
            ? 'OnboardingLedgerWalletAdded'
            : 'WalletImportLedgerWalletAdded'
        )

        if (walletState !== WalletState.NONEXISTENT) {
          showSnackbar('Ledger wallet created successfully!')
        }

        return { walletId: newWalletId, accountId: newAccountId }
      } catch (error) {
        AnalyticsService.capture(
          walletState === WalletState.NONEXISTENT
            ? 'OnboardingLedgerWalletAddFailed'
            : 'WalletImportLedgerWalletAddFailed'
        )
        Logger.error('Failed to create Ledger wallet:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch, setLedgerWalletMap, walletState]
  )

  const createLedgerAccount = useCallback(
    async ({
      deviceId,
      deviceName,
      derivationPathType,
      walletId,
      walletName,
      walletType,
      accountIndexToUse,
      avalancheKeys,
      solanaKeys = []
    }: WalletUpdateOptions & LedgerKeys) => {
      try {
        setIsLoading(true)

        if (!avalancheKeys) {
          throw new Error('Missing Avalanche keys for account creation')
        }

        const { addresses, xpubs, publicKeys: newPublicKeys } = avalancheKeys
        const formattedAddresses = getFormattedAddresses(addresses)

        const walletSecretResult = await BiometricsSDK.loadWalletSecret(
          walletId
        )

        if (
          walletSecretResult.success === false ||
          walletSecretResult.value === undefined
        ) {
          throw new Error('Failed to load existing wallet secret for update')
        }

        const parsedWalletSecret = LedgerWalletSecretSchema.parse(
          JSON.parse(walletSecretResult.value)
        )

        if (deviceId !== parsedWalletSecret.deviceId) {
          throw new Error(
            'Device ID mismatch between connected wallet and stored wallet'
          )
        }

        await dispatch(
          storeWallet({
            walletId,
            name: walletName,
            type: walletType,
            walletSecret: buildLedgerWalletSecret({
              type: WalletSecretOperation.UPDATE,
              deviceId,
              deviceName: deviceName || 'Ledger',
              derivationPathType,
              existingWalletSecret: parsedWalletSecret as unknown as Record<
                string,
                unknown
              >,
              accountIndex: accountIndexToUse,
              newXpubs: { evm: xpubs.evm, avalanche: xpubs.avalanche },
              newPublicKeys,
              newSolanaKeys: solanaKeys
            })
          })
        ).unwrap()

        setLedgerWalletMap(
          walletId,
          { id: deviceId, name: deviceName || 'Ledger' },
          derivationPathType
        )

        const newAccountId = uuid()
        const updatedAccount: PrimaryAccount = {
          id: newAccountId,
          walletId,
          name: `Account ${accountIndexToUse + 1}`,
          type: CoreAccountType.PRIMARY,
          index: accountIndexToUse,
          addressC: formattedAddresses.evm,
          addressCoreEth: formattedAddresses.coreEth,
          addressAVM: formattedAddresses.avm,
          addressPVM: formattedAddresses.pvm,
          addressBTC: formattedAddresses.btc,
          addressSVM: solanaKeys[0]?.key || ''
        }

        dispatch(setAccount(updatedAccount))
        dispatch(setActiveAccountId(newAccountId))

        Logger.info('Account created successfully')
        AnalyticsService.capture('WalletImportLedgerAccountAdded')
        showSnackbar('Account created successfully!')
        return { walletId, accountId: newAccountId }
      } catch (error) {
        AnalyticsService.capture('WalletImportLedgerAccountAddFailed')
        Logger.error('Failed to create account:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch, setLedgerWalletMap]
  )

  const createLedgerWalletWithDiscovery = useCallback(
    async ({
      deviceId,
      deviceName = 'Ledger',
      derivationPathType = LedgerDerivationPathType.BIP44,
      multiIndexKeys,
      activeIndices
    }: {
      deviceId: string
      deviceName: string
      derivationPathType: LedgerDerivationPathType
      multiIndexKeys: LedgerMultiIndexKeys
      activeIndices: number[]
    }) => {
      try {
        setIsLoading(true)

        Logger.info(
          `Creating ${derivationPathType} Ledger wallet with discovery for ${activeIndices.length} accounts...`
        )

        // Validate that index 0 keys exist
        const index0MainnetKeys = multiIndexKeys.mainnet[0]
        if (!index0MainnetKeys?.avalancheKeys) {
          throw new Error(
            'Missing Avalanche keys for account index 0 during wallet creation'
          )
        }

        const newWalletId = uuid()

        const { extendedPublicKeys, publicKeys } = buildKeysFromMultiIndex({
          multiIndexKeys,
          activeIndices,
          derivationPathType
        })

        // Store the wallet secret with all xpubs/publicKeys
        await dispatch(
          storeWallet({
            walletId: newWalletId,
            name: deviceName,
            walletSecret: buildLedgerWalletSecret({
              type: WalletSecretOperation.NEW,
              deviceId,
              deviceName,
              derivationPathType,
              extendedPublicKeys,
              publicKeys
            }),
            type:
              derivationPathType === LedgerDerivationPathType.BIP44
                ? WalletType.LEDGER
                : WalletType.LEDGER_LIVE
          })
        ).unwrap()

        setLedgerWalletMap(
          newWalletId,
          { id: deviceId, name: deviceName || 'Ledger' },
          derivationPathType
        )

        dispatch(setActiveWallet(newWalletId))

        // Create Redux accounts for each active index
        const createdAccounts: Array<{
          accountId: string
          accountIndex: number
        }> = []

        for (const index of activeIndices) {
          const mainnetKeys = multiIndexKeys.mainnet[index]
          const addresses = mainnetKeys?.avalancheKeys?.addresses

          const formattedAddresses = addresses
            ? getFormattedAddresses(addresses)
            : { evm: '', avm: '', pvm: '', btc: '', coreEth: '' }

          const solanaKey = mainnetKeys?.solanaKeys?.[0]?.key ?? ''

          const newAccountId = uuid()
          const newAccount: PrimaryAccount = {
            id: newAccountId,
            walletId: newWalletId,
            name: `Account ${index + 1}`,
            type: CoreAccountType.PRIMARY,
            index,
            addressC: formattedAddresses.evm,
            addressBTC: formattedAddresses.btc,
            addressAVM: formattedAddresses.avm,
            addressPVM: formattedAddresses.pvm,
            addressSVM: solanaKey,
            addressCoreEth: formattedAddresses.coreEth
          }

          dispatch(setAccount(newAccount))
          createdAccounts.push({ accountId: newAccountId, accountIndex: index })
        }

        // Set account 0 as the active account
        const firstAccount = createdAccounts.find(a => a.accountIndex === 0)
        if (firstAccount) {
          dispatch(setActiveAccountId(firstAccount.accountId))
        }

        Logger.info(
          `Ledger wallet created with ${createdAccounts.length} accounts:`,
          newWalletId
        )
        AnalyticsService.capture('LedgerAccountDiscoveryCompleted', {
          accountCount: createdAccounts.length,
          activeIndices
        })
        if (walletState !== WalletState.NONEXISTENT) {
          showSnackbar('Ledger wallet created successfully!')
        }
        return { walletId: newWalletId, createdAccounts }
      } catch (error) {
        AnalyticsService.capture('LedgerAccountDiscoveryFailed')
        Logger.error('Failed to create Ledger wallet with discovery:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch, setLedgerWalletMap, walletState]
  )

  const updateSolanaForLedgerWallet = useCallback(
    async ({
      deviceId,
      walletId,
      account,
      walletName,
      walletType,
      solanaKeys = []
    }: WalletUpdateSolanaOptions) => {
      try {
        setIsLoading(true)

        if (solanaKeys.length === 0 || !solanaKeys[0]?.key) {
          throw new Error('Missing Solana keys for wallet update')
        }

        const walletSecretResult = await BiometricsSDK.loadWalletSecret(
          walletId
        )

        if (
          walletSecretResult.success === false ||
          walletSecretResult.value === undefined
        ) {
          throw new Error('Failed to load existing wallet secret for update')
        }

        const parsedWalletSecret = LedgerWalletSecretSchema.parse(
          JSON.parse(walletSecretResult.value)
        )

        if (deviceId !== parsedWalletSecret.deviceId) {
          throw new Error(
            'Device ID mismatch between connected wallet and stored wallet'
          )
        }

        const accountIndex = account.index

        await dispatch(
          storeWallet({
            walletId,
            name: walletName,
            type: walletType,
            walletSecret: buildLedgerWalletSecret({
              type: WalletSecretOperation.SOLANA_UPDATE,
              deviceId: parsedWalletSecret.deviceId,
              deviceName: parsedWalletSecret.deviceName,
              derivationPathType: parsedWalletSecret.derivationPathSpec,
              existingWalletSecret: parsedWalletSecret as unknown as Record<
                string,
                unknown
              >,
              accountIndex,
              newSolanaKeys: solanaKeys
            })
          })
        ).unwrap()

        const updatedAccount: PrimaryAccount = {
          ...account,
          addressSVM: solanaKeys[0]?.key
        }

        dispatch(setAccount(updatedAccount))

        Logger.info('Solana address derived successfully')
        AnalyticsService.capture(
          walletState === WalletState.NONEXISTENT
            ? 'OnboardingLedgerSolanaKeysDerived'
            : 'WalletImportLedgerSolanaKeysDerived'
        )

        showSnackbar('Solana address derived successfully!')
      } catch (error) {
        Logger.error('Failed to derive Solana address:', error)
        AnalyticsService.capture(
          walletState === WalletState.NONEXISTENT
            ? 'OnboardingLedgerSolanaKeysDerivedFailed'
            : 'WalletImportLedgerSolanaKeysDerivedFailed'
        )
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch, walletState]
  )

  return {
    isLoading,
    createLedgerWallet,
    createLedgerWalletWithDiscovery,
    updateSolanaForLedgerWallet,
    createLedgerAccount
  }
}
