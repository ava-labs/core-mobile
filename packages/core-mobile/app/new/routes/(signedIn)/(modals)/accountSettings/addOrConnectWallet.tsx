import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  alpha,
  GroupList,
  Icons,
  Text,
  useTheme
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { showSnackbar } from 'new/common/utils/toast'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectAccounts } from 'store/account/slice'
import { useSelector, useDispatch } from 'react-redux'
import WalletService from 'services/wallet/WalletService'
import { addAccount } from 'store/account'

const ITEM_HEIGHT = 70

const AddOrConnectWalletScreen = (): JSX.Element => {
  const { back: _back, navigate: _navigate } = useRouter() // Mark as unused for now
  const {
    theme: { colors }
  } = useTheme()
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const accounts = useSelector(selectAccounts)
  const dispatch = useDispatch()

  const handleTypeRecoveryPhrase = (): void => {
    showSnackbar('TBD')
  }

  const handleImportPrivateKey = (): void => {
    // @ts-ignore TODO: make routes typesafe
    _navigate({ pathname: '/accountSettings/importPrivateKey' })
  }

  const handleCreateNewAccount = useCallback(async (): Promise<void> => {
    if (isAddingAccount) return

    try {
      AnalyticsService.capture('AccountSelectorAddAccount', {
        accountNumber: Object.keys(accounts).length + 1
      })

      setIsAddingAccount(true)
      // @ts-ignore
      await dispatch(addAccount()).unwrap()

      AnalyticsService.capture('CreatedANewAccountSuccessfully', {
        walletType: WalletService.walletType
      })
    } catch (error) {
      Logger.error('Unable to add account', error)
      showSnackbar('Unable to add account')
    } finally {
      setIsAddingAccount(false)
      _back()
    }
  }, [accounts, isAddingAccount, dispatch, _back])

  const data = [
    {
      title: (
        <Text variant="body1" sx={{ color: colors.$textPrimary, fontSize: 16 }}>
          Create new account
        </Text>
      ),
      subtitle: (
        <Text
          variant="caption"
          sx={{ color: alpha(colors.$textPrimary, 0.6), fontSize: 14 }}>
          Add new multi-chain account
        </Text>
      ),
      leftIcon: (
        <Icons.Content.Add color={colors.$textPrimary} width={24} height={24} />
      ),
      accessory: (
        <Icons.Navigation.ChevronRight color={colors.$textSecondary} />
      ),
      onPress: handleCreateNewAccount
    },
    {
      title: (
        <Text variant="body1" sx={{ color: colors.$textPrimary, fontSize: 16 }}>
          Type in a recovery phrase
        </Text>
      ),
      leftIcon: (
        <Icons.Device.GPPMaybe
          color={colors.$textPrimary}
          width={24}
          height={24}
        />
      ),
      accessory: (
        <Icons.Navigation.ChevronRight color={colors.$textSecondary} />
      ),
      onPress: handleTypeRecoveryPhrase
    },
    {
      title: (
        <Text variant="body1" sx={{ color: colors.$textPrimary, fontSize: 16 }}>
          Import a private key
        </Text>
      ),
      leftIcon: (
        <Icons.Custom.ArrowDown
          color={colors.$textPrimary}
          width={24}
          height={24}
        />
      ),
      accessory: (
        <Icons.Navigation.ChevronRight color={colors.$textSecondary} />
      ),
      onPress: handleImportPrivateKey
    }
  ]

  return (
    <ScrollScreen
      title={`Add or connect\na wallet`}
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <GroupList itemHeight={ITEM_HEIGHT} data={data} />
      <ActivityIndicator animating={isAddingAccount} sx={{ marginTop: 16 }} />
    </ScrollScreen>
  )
}

export default AddOrConnectWalletScreen
