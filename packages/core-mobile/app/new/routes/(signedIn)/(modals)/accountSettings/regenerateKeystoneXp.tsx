import React, { useCallback, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { Text, View, useTheme } from '@avalabs/k2-alpine'
import { KeystoneQrScanner } from 'new/common/components/KeystoneQrScanner'
import KeystoneSDK from '@keystonehq/keystone-sdk'
import { UR } from '@ngraveio/bc-ur'
import { getAvalancheExtendedKeyPath } from 'utils/publicKeys'
import { selectAccountById, setAccount } from 'store/account'
import { selectAccountsByWalletId, setAccounts } from 'store/account/slice'
import { AccountCollection } from 'store/account/types'
import { selectWalletById } from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import AccountsService from 'services/account/AccountsService'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { KeystoneDataStorage } from 'features/keystone/storage/KeystoneDataStorage'
import { bip32 } from 'utils/bip32'
import { RootState } from 'store/types'

const RegenerateKeystoneXpScreen = (): JSX.Element => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { accountId = '', walletId = '' } = useLocalSearchParams<{
    accountId?: string
    walletId?: string
  }>()
  const account = useSelector(selectAccountById(accountId))
  const wallet = useSelector(selectWalletById(walletId))
  const walletAccounts = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, walletId ?? '')
  )
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const {
    theme: { colors }
  } = useTheme()
  const [errorMessage, setErrorMessage] = useState<string>()

  const handleSuccess = useCallback(
    async (ur: UR) => {
      if (!account || !wallet || wallet.type !== WalletType.KEYSTONE) {
        setErrorMessage('Wallet not available')
        return
      }

      try {
        const sdk = new KeystoneSDK()
        const parsed = sdk.parseMultiAccounts(ur)
        const targetPath = getAvalancheExtendedKeyPath(account.index)
        const avaxKey = parsed.keys.find(
          key => key.chain === 'AVAX' && key.path === targetPath
        )

        if (!avaxKey) {
          setErrorMessage('Scan did not include this account. Try again.')
          return
        }

        const node = bip32.fromPublicKey(
          Buffer.from(avaxKey.publicKey, 'hex'),
          Buffer.from(avaxKey.chainCode, 'hex')
        )
        await KeystoneDataStorage.upsertExtendedKey({
          path: avaxKey.path,
          key: node.toBase58(),
          chainCode: avaxKey.chainCode
        })

        const addresses = await AccountsService.getAddresses({
          walletId: wallet.id,
          walletType: wallet.type,
          accountIndex: account.index,
          isTestnet: isDeveloperMode
        })

        const updatedAccount = {
          ...account,
          addressAVM: addresses[NetworkVMType.AVM],
          addressPVM: addresses[NetworkVMType.PVM]
        }

        dispatch(setAccount(updatedAccount))

        const accountCollection: AccountCollection = {}
        walletAccounts.forEach(acc => {
          accountCollection[acc.id] =
            acc.id === updatedAccount.id ? updatedAccount : acc
        })

        const reloadedAccounts = await AccountsService.reloadAccounts({
          accounts: accountCollection,
          isTestnet: isDeveloperMode,
          walletId: wallet.id,
          walletType: wallet.type
        })

        dispatch(setAccounts(reloadedAccounts))

        router.back()
      } catch (error) {
        setErrorMessage('Failed to process Keystone export.')
      }
    },
    [account, dispatch, isDeveloperMode, router, wallet, walletAccounts]
  )

  if (!account || !wallet || wallet.type !== WalletType.KEYSTONE) {
    return <></>
  }

  return (
    <ScrollScreen
      isModal
      navigationTitle="Regenerate XP Addresses"
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ gap: 16 }}>
        <Text variant="body1">
          Scan the Keystone multi-account QR for this wallet to regenerate the
          missing X/P addresses.
        </Text>
        {errorMessage && (
          <Text variant="body2" sx={{ color: colors.$textDanger }}>
            {errorMessage}
          </Text>
        )}
        <KeystoneQrScanner
          urTypes={['crypto-multi-accounts']}
          onSuccess={handleSuccess}
        />
      </View>
    </ScrollScreen>
  )
}

export default RegenerateKeystoneXpScreen
