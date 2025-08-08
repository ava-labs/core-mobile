import { useState, useCallback, useEffect } from 'react'
import { LedgerService } from 'services/ledger/ledgerService'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import Logger from 'utils/Logger'

export interface BasePublicKey {
  path: string
  key: string
  chainCode: string
  network: NetworkVMType
}

export interface PublicKeyInfo {
  key: string
  derivationPath: string
  curve: 'secp256k1' | 'ed25519'
  network: NetworkVMType
}

export interface UseLedgerBasePublickKeyFetcherProps {
  deviceId?: string
  derivationPathSpec?: 'BIP44' | 'LedgerLive'
  accountIndex?: number
  count?: number
}

export interface UseLedgerBasePublickKeyFetcherReturn {
  basePublicKeys: BasePublicKey[]
  publicKeys: PublicKeyInfo[]
  isLoading: boolean
  error: string | null
  connect: (deviceId: string) => Promise<void>
  fetchBasePublicKeys: () => Promise<void>
  fetchPublicKeys: () => Promise<void>
  disconnect: () => Promise<void>
  isConnected: boolean
}

export const useLedgerBasePublickKeyFetcher = ({
  deviceId,
  derivationPathSpec = 'BIP44',
  accountIndex = 0,
  count = 5
}: UseLedgerBasePublickKeyFetcherProps = {}): UseLedgerBasePublickKeyFetcherReturn => {
  const [ledgerService] = useState(() => new LedgerService())
  const [basePublicKeys, setBasePublicKeys] = useState<BasePublicKey[]>([])
  const [publicKeys, setPublicKeys] = useState<PublicKeyInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = useCallback(async (deviceId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      await ledgerService.connect(deviceId)
      setIsConnected(true)
      console.log('Successfully connected to Ledger device')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to connect to Ledger: ${errorMessage}`)
      Logger.error('Ledger connection failed:', err)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [ledgerService])

  const fetchBasePublicKeys = useCallback(async () => {
    if (!isConnected) {
      setError('Device not connected')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get extended public keys for BIP44 derivation
      const extendedPublicKeys = await ledgerService.getExtendedPublicKeys()
      
      const baseKeys: BasePublicKey[] = [
        {
          path: extendedPublicKeys.evm.path,
          key: extendedPublicKeys.evm.key,
          chainCode: extendedPublicKeys.evm.chainCode,
          network: NetworkVMType.EVM
        },
        {
          path: extendedPublicKeys.avalanche.path,
          key: extendedPublicKeys.avalanche.key,
          chainCode: extendedPublicKeys.avalanche.chainCode,
          network: NetworkVMType.AVM
        }
      ]

      setBasePublicKeys(baseKeys)
      console.log('Successfully fetched base public keys')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to fetch base public keys: ${errorMessage}`)
      Logger.error('Base public key fetching failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, ledgerService])

  const fetchPublicKeys = useCallback(async () => {
    if (!isConnected) {
      setError('Device not connected')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get individual public keys for LedgerLive derivation
      const keys = await ledgerService.getPublicKeys(accountIndex, count)
      
      const publicKeyInfos: PublicKeyInfo[] = keys.map(key => ({
        key: key.key,
        derivationPath: key.derivationPath,
        curve: key.curve,
        network: getNetworkFromDerivationPath(key.derivationPath)
      }))

      setPublicKeys(publicKeyInfos)
      console.log('Successfully fetched public keys')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to fetch public keys: ${errorMessage}`)
      Logger.error('Public key fetching failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, accountIndex, count, ledgerService])

  const disconnect = useCallback(async () => {
    try {
      await ledgerService.disconnect()
      setIsConnected(false)
      setBasePublicKeys([])
      setPublicKeys([])
      setError(null)
      console.log('Successfully disconnected from Ledger device')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Failed to disconnect: ${errorMessage}`)
      Logger.error('Ledger disconnection failed:', err)
    }
  }, [ledgerService])

  // Helper function to determine network from derivation path
  const getNetworkFromDerivationPath = (derivationPath: string): NetworkVMType => {
    if (derivationPath.includes("'/60'")) {
      return NetworkVMType.EVM
    } else if (derivationPath.includes("'/9000'")) {
      return NetworkVMType.AVM
    } else if (derivationPath.includes("'/0'")) {
      return NetworkVMType.BITCOIN
    } else if (derivationPath.includes("'/501'")) {
      return NetworkVMType.SVM
    }
    return NetworkVMType.EVM // Default fallback
  }

  // Auto-connect when deviceId changes
  useEffect(() => {
    if (deviceId && !isConnected) {
      connect(deviceId)
    }
  }, [deviceId, connect, isConnected])

  // Auto-fetch base public keys when connected and in BIP44 mode
  useEffect(() => {
    if (isConnected && derivationPathSpec === 'BIP44') {
      fetchBasePublicKeys()
    }
  }, [isConnected, derivationPathSpec, fetchBasePublicKeys])

  // Auto-fetch public keys when connected and in LedgerLive mode
  useEffect(() => {
    if (isConnected && derivationPathSpec === 'LedgerLive') {
      fetchPublicKeys()
    }
  }, [isConnected, derivationPathSpec, fetchPublicKeys])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect()
      }
    }
  }, [isConnected, disconnect])

  return {
    basePublicKeys,
    publicKeys,
    isLoading,
    error,
    connect,
    fetchBasePublicKeys,
    fetchPublicKeys,
    disconnect,
    isConnected
  }
}