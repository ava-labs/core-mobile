import { useRouter } from 'expo-router'
import { useNavigation } from '@react-navigation/native'
import React, {
  useLayoutEffect,
  useCallback,
  useState,
  useMemo,
  useRef
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  ActivityIndicator,
  AnimatedBalance,
  GroupList,
  Icons,
  ScrollView,
  SearchBar,
  Separator,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import {
  addAccount,
  selectAccounts,
  setActiveAccountIndex
} from 'store/account'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import WalletService from 'services/wallet/WalletService'
import { showSnackbar } from 'common/utils/toast'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { selectTokenVisibility } from 'store/portfolio'
import { selectBalanceTotalInCurrencyForAccount } from 'store/balance'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { ScrollView as RnScrollView } from 'react-native'

const ITEM_HEIGHT = 50

const ManageAccountsScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { setOptions } = useNavigation()
  const dispatch = useDispatch()
  const { navigate } = useRouter()
  const [searchText, setSearchText] = useState('')
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const accountCollection = useSelector(selectAccounts)
  const scrollViewRef = useRef<RnScrollView>(null)

  const accounts = useMemo(
    () => Object.values(accountCollection),
    [accountCollection]
  )

  const gotoAccountDetails = useCallback(
    (accountIndex: number): void => {
      navigate({
        pathname: '/accountSettings/account',
        params: { accountIndex: accountIndex.toString() }
      })
    },
    [navigate]
  )

  const accountSearchResults = useMemo(() => {
    return accounts.filter(account => {
      return account.name.toLowerCase().includes(searchText.toLowerCase())
    })
  }, [accounts, searchText])

  const data = useMemo(() => {
    return accountSearchResults.map(account => ({
      title: account.name,
      subtitle: truncateAddress(account.addressC),
      leftIcon: account.active ? (
        <Icons.Custom.CheckSmall
          color={colors.$textPrimary}
          width={24}
          height={24}
        />
      ) : (
        <View sx={{ width: 24 }} />
      ),
      value: <AccountBalance accountIndex={account.index} />,
      onPress: () => dispatch(setActiveAccountIndex(account.index)),
      accessory: (
        <TouchableOpacity
          hitSlop={16}
          sx={{ marginLeft: 13 }}
          onPress={() => gotoAccountDetails(account.index)}>
          <Icons.Alert.AlertCircle
            color={colors.$textSecondary}
            width={18}
            height={18}
          />
        </TouchableOpacity>
      )
    }))
  }, [
    accountSearchResults,
    colors.$textPrimary,
    colors.$textSecondary,
    dispatch,
    gotoAccountDetails
  ])

  const handleAddAccount = useCallback(async (): Promise<void> => {
    if (isAddingAccount) return

    try {
      AnalyticsService.capture('AccountSelectorAddAccount', {
        accountNumber: Object.keys(accounts).length + 1
      })

      setIsAddingAccount(true)
      // @ts-expect-error
      // dispatch here is not typed correctly
      await dispatch(addAccount()).unwrap()

      AnalyticsService.capture('CreatedANewAccountSuccessfully', {
        walletType: WalletService.walletType
      })
    } catch (error) {
      Logger.error('Unable to add account', error)
      showSnackbar('Unable to add account')
    } finally {
      setIsAddingAccount(false)
      scrollViewRef.current?.scrollTo({
        y: data.length * ITEM_HEIGHT,
        animated: true
      })
    }
  }, [accounts, data.length, dispatch, isAddingAccount])

  const renderHeaderRight = useCallback(() => {
    return (
      <TouchableOpacity
        onPress={handleAddAccount}
        sx={{
          flexDirection: 'row',
          gap: 16,
          marginRight: 18,
          alignItems: 'center'
        }}>
        <Icons.Content.Add
          testID="add_account_btn"
          width={25}
          height={25}
          color={colors.$textPrimary}
        />
      </TouchableOpacity>
    )
  }, [colors.$textPrimary, handleAddAccount])

  useLayoutEffect(() => {
    setOptions({
      headerRight: renderHeaderRight,
      headerTitle: 'Manage accounts'
    })
  }, [renderHeaderRight, setOptions])

  return (
    <View sx={{ flex: 1 }}>
      <View sx={{ zIndex: 1000 }}>
        <View sx={{ alignItems: 'center' }}>
          <SearchBar
            onTextChanged={setSearchText}
            searchText={searchText}
            useDebounce={true}
          />
        </View>
        <Separator sx={{ marginTop: 11, marginBottom: 16 }} />
      </View>
      <ScrollView
        ref={scrollViewRef}
        sx={{ marginHorizontal: 16, overflow: 'hidden' }}
        contentContainerStyle={{
          paddingBottom: ITEM_HEIGHT
        }}
        showsVerticalScrollIndicator={false}>
        <GroupList
          itemHeight={ITEM_HEIGHT}
          data={data}
          titleSx={{
            fontSize: 14,
            lineHeight: 16,
            fontFamily: 'Inter-Regular'
          }}
        />
        <ActivityIndicator animating={isAddingAccount} sx={{ marginTop: 16 }} />
      </ScrollView>
    </View>
  )
}

export default ManageAccountsScreen

const AccountBalance = ({
  accountIndex
}: {
  accountIndex: number
}): React.JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const {
    theme: { colors }
  } = useTheme()

  const tokenVisibility = useSelector(selectTokenVisibility)
  const accountBalance = useSelector(
    selectBalanceTotalInCurrencyForAccount(accountIndex, tokenVisibility)
  )
  const { formatCurrency } = useFormatCurrency()

  const balance = useMemo(() => {
    if (accountBalance === 0) {
      return ''
    }
    return formatCurrency({ amount: accountBalance })
  }, [accountBalance, formatCurrency])

  return (
    <AnimatedBalance
      variant="body1"
      balance={balance}
      shouldMask={isPrivacyModeEnabled}
      balanceSx={{ color: colors.$textSecondary, lineHeight: 18 }}
    />
  )
}
