import { useEffect, useState } from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { LedgerDerivationPathType } from 'services/ledger/types'
import { useSelector } from 'react-redux'
import { selectWalletById } from 'store/wallet/slice'
import { LedgerWalletSecretSchema } from '../utils'

export const useLedgerDeviceInfo = (
  walletId?: string | null
): {
  deviceId?: string
  deviceName?: string
  derivationPathType?: LedgerDerivationPathType
} => {
  const [deviceId, setDeviceId] = useState<string>()
  const [deviceName, setDeviceName] = useState<string>()
  const [derivationPathType, setDerivationPathType] =
    useState<LedgerDerivationPathType>()
  const wallet = useSelector(selectWalletById(walletId ?? ''))

  useEffect(() => {
    // Fetch the device info for the given walletId from your store or service
    // For example, if you have a function getLedgerDeviceInfo(walletId) that returns { deviceId, deviceName }
    const fetchDeviceInfo = async (): Promise<void> => {
      try {
        if (
          !wallet ||
          (wallet.type !== 'LEDGER' && wallet.type !== 'LEDGER_LIVE')
        ) {
          setDeviceId(undefined)
          setDeviceName(undefined)
          setDerivationPathType(undefined)
          return
        }
        const walletSecret = await BiometricsSDK.loadWalletSecret(wallet.id)
        if (
          walletSecret.success === false ||
          walletSecret.value === undefined
        ) {
          throw new Error('Failed to load existing wallet secret for update')
        }

        const parsedWalletSecret = LedgerWalletSecretSchema.parse(
          JSON.parse(walletSecret.value)
        )
        setDerivationPathType(parsedWalletSecret.derivationPathSpec)
        setDeviceId(parsedWalletSecret.deviceId)
        setDeviceName(parsedWalletSecret.deviceName || 'Ledger Device')
      } catch (error) {
        Logger.error('Failed to fetch Ledger device info:', error)
        setDeviceId(undefined)
        setDeviceName(undefined)
        setDerivationPathType(undefined)
      }
    }

    fetchDeviceInfo()
  }, [wallet])

  return { deviceId, deviceName, derivationPathType }
}
