import { strip0x } from '@avalabs/core-utils-sdk'
import {
  getBtcAddressFromPubKey,
  getEvmAddressFromPubKey,
  getPublicKeyFromPrivateKey
} from '@avalabs/core-wallets-sdk'
import { CoreAccountType } from '@avalabs/types'
import { networks } from 'bitcoinjs-lib'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { CORE_MOBILE_WALLET_ID } from 'services/walletconnectv2/types'
import { selectAccounts } from 'store/account'
import { ImportedAccount } from 'store/account/types'
import { RootState } from 'store/types'
import Logger from 'utils/Logger'
import { uuid } from 'utils/uuid'

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

  // Select only the scalar count we need; selecting the whole accounts map
  // would re-create deriveAddresses on every unrelated account-slice update
  // (rename, add non-imported, etc.) and re-run the derivation effect.
  const importedAccountsCount = useSelector(
    (state: RootState) =>
      Object.values(selectAccounts(state)).filter(
        account => account.type === CoreAccountType.IMPORTED
      ).length
  )

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

      const accountsCount = importedAccountsCount + 1

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
  }, [isTestnet, privateKey, importedAccountsCount])

  useEffect(() => {
    if (privateKey !== '') {
      deriveAddresses()
    } else {
      setDerivedAddresses([])
      setTempAccountDetails(null)
    }
  }, [privateKey, deriveAddresses])

  useEffect(() => {
    setShowDerivedInfo(derivedAddresses.length > 0)
  }, [derivedAddresses])

  return {
    derivedAddresses,
    tempAccountDetails,
    showDerivedInfo
  }
}
