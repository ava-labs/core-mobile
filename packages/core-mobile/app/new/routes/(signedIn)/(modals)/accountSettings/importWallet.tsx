import { useRouter } from 'expo-router'
import React, { useCallback, useState, useMemo } from 'react'
import { alpha, GroupList, Icons, Text, useTheme } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { showSnackbar } from 'new/common/utils/toast'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectAccounts } from 'store/account/slice'
import { useSelector, useDispatch } from 'react-redux'
import { addAccount } from 'store/account'
import { WalletType } from 'services/wallet/types'
import { AppThunkDispatch } from 'store/types'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { LoadingState } from 'common/components/LoadingState'

const ITEM_HEIGHT = 70

const ImportWalletScreen = (): JSX.Element => {
  const { back, navigate } = useRouter()
  const {
    theme: { colors }
  } = useTheme()
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const accounts = useSelector(selectAccounts)
  const dispatch = useDispatch<AppThunkDispatch>()
  const activeWallet = useActiveWallet()

  const handleCreateNewAccount = useCallback(async (): Promise<void> => {
    if (isAddingAccount) return

    try {
      AnalyticsService.capture('AccountSelectorAddAccount', {
        accountNumber: Object.keys(accounts).length + 1
      })

      setIsAddingAccount(true)
      await dispatch(addAccount()).unwrap()

      AnalyticsService.capture('CreatedANewAccountSuccessfully', {
        walletType: activeWallet.type
      })
    } catch (error) {
      Logger.error('Unable to add account', error)
      showSnackbar('Unable to add account')
    } finally {
      setIsAddingAccount(false)
      back()
    }
  }, [isAddingAccount, accounts, dispatch, activeWallet.type, back])

  const data = useMemo(() => {
    const handleTypeRecoveryPhrase = (): void => {
      // @ts-ignore TODO: make routes typesafe
      navigate({ pathname: '/accountSettings/importSeedWallet' })
    }

    const handleImportPrivateKey = (): void => {
      // @ts-ignore TODO: make routes typesafe
      navigate({ pathname: '/accountSettings/importPrivateKey' })
    }

    const baseData = [
      {
        title: (
          <Text
            variant="body1"
            sx={{ color: colors.$textPrimary, fontSize: 16 }}>
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
          <Text
            variant="body1"
            sx={{ color: colors.$textPrimary, fontSize: 16 }}>
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

    if (activeWallet?.type !== WalletType.PRIVATE_KEY) {
      return [
        {
          title: (
            <Text
              variant="body1"
              sx={{ color: colors.$textPrimary, fontSize: 16 }}>
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
            <Icons.Content.Add
              color={colors.$textPrimary}
              width={24}
              height={24}
            />
          ),
          accessory: (
            <Icons.Navigation.ChevronRight color={colors.$textSecondary} />
          ),
          onPress: handleCreateNewAccount
        },
        ...baseData
      ]
    }

    return baseData
  }, [navigate, activeWallet?.type, colors, handleCreateNewAccount])

  return (
    <ScrollScreen
      title={`Add or connect\na wallet`}
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <GroupList itemHeight={ITEM_HEIGHT} data={data} />
      {isAddingAccount && <LoadingState sx={{ marginTop: 16 }} />}
    </ScrollScreen>
  )
}

export default ImportWalletScreen
