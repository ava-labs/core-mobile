import { GroupList, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { useRouter } from 'expo-router'
import { showSnackbar } from 'new/common/utils/toast'
import React, { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import { addAccount } from 'store/account'
import { selectAccountsByWalletId } from 'store/account/slice'
import { selectIsLedgerSupportBlocked } from 'store/posthog'
import { AppThunkDispatch, RootState } from 'store/types'
import { selectIsMigratingActiveAccounts } from 'store/wallet/slice'
import Logger from 'utils/Logger'

const ITEM_HEIGHT = 70

const ImportWalletScreen = (): JSX.Element => {
  const { back, navigate } = useRouter()
  const {
    theme: { colors }
  } = useTheme()
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const dispatch = useDispatch<AppThunkDispatch>()
  const activeWallet = useActiveWallet()
  const isLedgerSupportBlocked = useSelector(selectIsLedgerSupportBlocked)
  const isMigratingActiveAccounts = useSelector(selectIsMigratingActiveAccounts)
  const accountsByWalletId = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, activeWallet.id)
  )

  const handleCreateNewAccount = useCallback(async (): Promise<void> => {
    if (isAddingAccount) return

    try {
      // TODO: figure out how to get the account number and if we should include the wallet ID
      AnalyticsService.capture('AccountSelectorAddAccount', {
        accountNumber: accountsByWalletId.length + 1
      })

      setIsAddingAccount(true)
      await dispatch(addAccount(activeWallet.id)).unwrap()

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
  }, [
    isAddingAccount,
    accountsByWalletId.length,
    dispatch,
    activeWallet.id,
    activeWallet.type,
    back
  ])

  const data = useMemo(() => {
    const handleTypeRecoveryPhrase = (): void => {
      // @ts-ignore TODO: make routes typesafe
      navigate({ pathname: '/accountSettings/importSeedWallet' })
    }

    const handleImportPrivateKey = (): void => {
      // @ts-ignore TODO: make routes typesafe
      navigate({ pathname: '/accountSettings/importPrivateKey' })
    }

    const handleImportLedger = (): void => {
      // @ts-ignore TODO: make routes typesafe
      navigate({ pathname: '/accountSettings/ledger' })
    }

    const baseData = [
      {
        title: 'Type in a recovery phrase',
        subtitle: (
          <Text
            testID="import_recovery_phrase_btn"
            variant="caption"
            sx={{ fontSize: 12, paddingTop: 4 }}>
            Access with your recovery phrase
          </Text>
        ),
        leftIcon: (
          <Icons.Device.Encrypted
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
        title: 'Import a private key',
        subtitle: (
          <Text
            testID="import_private_key_btn"
            variant="caption"
            sx={{ fontSize: 12, paddingTop: 4 }}>
            Access with an existing private key
          </Text>
        ),
        leftIcon: (
          <Icons.Custom.Download
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

    if (!isLedgerSupportBlocked) {
      baseData.push({
        title: 'Import from Ledger',
        subtitle: (
          <Text variant="caption" sx={{ fontSize: 12, paddingTop: 4 }}>
            Access with an existing Ledger
          </Text>
        ),
        leftIcon: (
          <Icons.Custom.Ledger
            color={colors.$textPrimary}
            width={24}
            height={24}
          />
        ),
        accessory: (
          <Icons.Navigation.ChevronRight color={colors.$textSecondary} />
        ),
        onPress: handleImportLedger
      })
    }

    if (
      activeWallet?.type !== WalletType.PRIVATE_KEY &&
      !isMigratingActiveAccounts
    ) {
      return [
        {
          title: 'Create new account',
          subtitle: (
            <Text
              testID="create_new_account_btn"
              variant="caption"
              sx={{ fontSize: 12, paddingTop: 4 }}>
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
  }, [
    navigate,
    activeWallet?.type,
    colors,
    handleCreateNewAccount,
    isLedgerSupportBlocked,
    isMigratingActiveAccounts
  ])

  return (
    <ScrollScreen
      title={`Add or connect\na wallet`}
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View
        style={{
          marginTop: 24
        }}>
        <GroupList itemHeight={ITEM_HEIGHT} data={data} />
        {isAddingAccount && <LoadingState sx={{ marginTop: 16 }} />}
      </View>
    </ScrollScreen>
  )
}
export default ImportWalletScreen
