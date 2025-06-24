import { useCallback, useEffect, useState } from 'react'
import {
  getBtcAddressFromPubKey,
  getEvmAddressFromPubKey,
  getPublicKeyFromPrivateKey
} from '@avalabs/core-wallets-sdk'
import { strip0x } from '@avalabs/core-utils-sdk'
import { networks } from 'bitcoinjs-lib'
import { CoreAccountType } from '@avalabs/types'
import { uuid } from 'utils/uuid'
import { ImportedAccount } from 'store/account/types'
import { CORE_MOBILE_WALLET_ID } from 'services/walletconnectv2/types'
import Logger from 'utils/Logger'
import { useSelector } from 'react-redux'
import { selectAccounts } from 'store/account'

export interface DerivedAddress {
  address: string
  symbol: string
}

export const useDeriveAddresses = (
  privateKey: string,
  isTestnet: boolean
): {
  derivedAddresses: DerivedAddress[]
  tempAccountDetails: ImportedAccount | null
  showDerivedInfo: boolean
} => {
  const [derivedAddresses, setDerivedAddresses] = useState<DerivedAddress[]>([])
  const [tempAccountDetails, setTempAccountDetails] =
    useState<ImportedAccount | null>(null)
  const [showDerivedInfo, setShowDerivedInfo] = useState(false)

  const accounts = useSelector(selectAccounts)

  const deriveAddresses = useCallback(async (): Promise<void> => {
    setDerivedAddresses([])
    setTempAccountDetails(null)

    try {
      const strippedPk = strip0x(privateKey)
      if (strippedPk.length !== 64) {
        throw new Error('Invalid private key')
      }

      const publicKey = getPublicKeyFromPrivateKey(strippedPk)

      const addressC = getEvmAddressFromPubKey(publicKey)
      const addressBTC = getBtcAddressFromPubKey(
        publicKey,
        isTestnet ? networks.testnet : networks.bitcoin
      )

      const accountsCount = Object.keys(accounts).length + 1

      const newTempAccountData = {
        id: uuid(),
        index: 0,
        name: `Account ${accountsCount}`,
        type: CoreAccountType.IMPORTED,
        walletId: CORE_MOBILE_WALLET_ID,
        addressC,
        addressBTC,
        addressAVM: '',
        addressPVM: '',
        addressCoreEth: addressC
      } as ImportedAccount
      setTempAccountDetails(newTempAccountData)

      setDerivedAddresses([
        {
          address: addressC,
          symbol: 'AVAX'
        },
        {
          address: addressBTC,
          symbol: 'BTC'
        }
      ])
    } catch (error) {
      Logger.info('error deriving addresses:', error)
      setDerivedAddresses([])
      setTempAccountDetails(null)
    }
  }, [isTestnet, privateKey, accounts])

  useEffect(() => {
    if (privateKey.trim() !== '') {
      deriveAddresses()
      setShowDerivedInfo(true)
    } else {
      setShowDerivedInfo(false)
      setDerivedAddresses([])
      setTempAccountDetails(null)
    }
  }, [privateKey, deriveAddresses])

  return {
    derivedAddresses,
    tempAccountDetails,
    showDerivedInfo
  }
}
