import { showSnackbar } from 'new/common/utils/toast'
import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  LedgerDerivationPathType,
  LedgerKeys,
  WalletCreationOptions,
  WalletUpdateOptions,
  WalletUpdateSolanaOptions
} from 'services/ledger/types'
import { WalletType } from 'services/wallet/types'
import { PrimaryAccount, setAccount, setActiveAccountId } from 'store/account'
import { AppThunkDispatch } from 'store/types'
import { setActiveWallet } from 'store/wallet/slice'
import { storeWallet } from 'store/wallet/thunks'
import Logger from 'utils/Logger'
import { uuid } from 'utils/uuid'
import { CoreAccountType } from '@avalabs/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { LedgerWalletSecretSchema } from '../utils'
import { useLedgerWalletMap } from '../store'

export interface UseLedgerWalletReturn {
  isLoading: boolean

  // Methods
  createLedgerWallet: (
    options: WalletCreationOptions & LedgerKeys
  ) => Promise<{ walletId: string; accountId: string }>
  updateSolanaForLedgerWallet: (
    options: WalletUpdateSolanaOptions
  ) => Promise<void>
  createLedgerAccount: (
    options: WalletUpdateOptions & LedgerKeys
  ) => Promise<{ walletId: string; accountId: string }>
}

export function useLedgerWallet(): UseLedgerWalletReturn {
  const { setLedgerWalletMap } = useLedgerWalletMap()
  const dispatch = useDispatch<AppThunkDispatch>()
  const [isLoading, setIsLoading] = useState(false)

  const createLedgerWallet = useCallback(
    async ({
      deviceId,
      deviceName = 'Ledger Device',
      derivationPathType = LedgerDerivationPathType.BIP44,
      avalancheKeys,
      solanaKeys = []
    }: WalletCreationOptions & LedgerKeys) => {
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
            name: `Ledger ${deviceName}`,
            walletSecret: JSON.stringify({
              deviceId,
              deviceName,
              derivationPathSpec: derivationPathType,
              ...(derivationPathType === LedgerDerivationPathType.BIP44 && {
                // Store in per-account format: { [accountIndex]: { evm, avalanche } }
                // This supports storing xpubs for additional accounts later
                extendedPublicKeys: {
                  0: {
                    evm: xpubs.evm, // Store base58 xpub for derivation
                    avalanche: xpubs.avalanche // Store base58 xpub for derivation
                  }
                }
              }),
              publicKeys: {
                0: [
                  ...publicKeys,
                  ...(solanaKeys?.length > 0 ? [solanaKeys[0]] : [])
                ].filter(Boolean)
              }
            }),
            type:
              derivationPathType === LedgerDerivationPathType.BIP44
                ? WalletType.LEDGER
                : WalletType.LEDGER_LIVE
          })
        ).unwrap()

        setLedgerWalletMap(
          newWalletId,
          { id: deviceId, name: deviceName || 'Ledger Device' },
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
        AnalyticsService.capture('ImportLedger_WalletAdded')
        showSnackbar('Ledger wallet created successfully!')
        return { walletId: newWalletId, accountId: newAccountId }
      } catch (error) {
        AnalyticsService.capture('ImportLedger_WalletAddFailed')
        Logger.error('Failed to create Ledger wallet:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch, setLedgerWalletMap]
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

        // Destructure to explicitly omit extendedPublicKeys from spread
        // This ensures LedgerLive wallets don't preserve invalid extendedPublicKeys
        const { extendedPublicKeys, publicKeys, ...baseWalletSecret } =
          parsedWalletSecret

        // Update the Ledger wallet extended public keys for new account
        await dispatch(
          storeWallet({
            walletId,
            name: walletName,
            type: walletType,
            walletSecret: JSON.stringify({
              ...baseWalletSecret,
              // For BIP44, update the extended public keys for account index
              ...(baseWalletSecret.derivationPathSpec ===
                LedgerDerivationPathType.BIP44 && {
                extendedPublicKeys: {
                  ...extendedPublicKeys,
                  [accountIndexToUse]: {
                    evm: xpubs.evm, // Update with new xpub from getAvalancheKeys
                    avalanche: xpubs.avalanche // Update with new xpub from getAvalancheKeys
                  }
                }
              }),
              publicKeys: {
                ...publicKeys,
                [accountIndexToUse]: [
                  ...newPublicKeys,
                  ...(solanaKeys.length > 0 ? [solanaKeys[0]] : [])
                ].filter(Boolean)
              }
            })
          })
        ).unwrap()

        setLedgerWalletMap(
          walletId,
          { id: deviceId, name: deviceName || 'Ledger Device' },
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
        AnalyticsService.capture('ImportLedger_AccountAdded')
        showSnackbar('Account created successfully!')
        return { walletId, accountId: newAccountId }
      } catch (error) {
        AnalyticsService.capture('ImportLedger_AccountAddFailed')
        Logger.error('Failed to create account:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch, setLedgerWalletMap]
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

        const { publicKeys, ...baseWalletSecret } = parsedWalletSecret
        const accountIndex = account.index

        // Update the Ledger wallet extended public keys for new account
        await dispatch(
          storeWallet({
            walletId,
            name: walletName,
            type: walletType,
            walletSecret: JSON.stringify({
              ...baseWalletSecret,
              publicKeys: {
                ...publicKeys,
                [accountIndex]: [
                  ...(publicKeys[accountIndex] ?? []),
                  ...(solanaKeys.length > 0 ? [solanaKeys[0]] : [])
                ].filter(Boolean)
              }
            })
          })
        ).unwrap()

        const updatedAccount: PrimaryAccount = {
          ...account,
          addressSVM: solanaKeys[0]?.key
        }

        dispatch(setAccount(updatedAccount))

        Logger.info('Solana address derived successfully')
        AnalyticsService.capture('ImportLedger_SolanaEnabled')

        showSnackbar('Solana address derived successfully!')
      } catch (error) {
        Logger.error('Failed to derive Solana address:', error)
        AnalyticsService.capture('ImportLedger_SolanaEnableFailed')
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [dispatch]
  )

  return {
    isLoading,
    createLedgerWallet,
    updateSolanaForLedgerWallet,
    createLedgerAccount
  }
}

// Fix address formatting - remove double 0x prefixes that cause VM module errors
const getFormattedAddresses = (address: {
  evm: string
  avm: string
  pvm: string
  btc: string
  coreEth: string
}): {
  evm: string
  avm: string
  pvm: string
  btc: string
  coreEth: string
} => {
  return {
    evm: address.evm?.startsWith('0x0x')
      ? address.evm.slice(2) // Remove first 0x to fix double prefix
      : address.evm,
    avm: address.avm,
    pvm: address.pvm,
    btc: address.btc,
    coreEth: address.coreEth?.startsWith('0x0x')
      ? address.coreEth.slice(2) // Remove first 0x to fix double prefix
      : address.coreEth
  }
}
