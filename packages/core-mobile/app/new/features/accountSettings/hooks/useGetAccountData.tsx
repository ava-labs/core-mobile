import { truncateAddress } from '@avalabs/core-utils-sdk/dist'
import {
  alpha,
  Icons,
  SCREEN_WIDTH,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { AccountDataForWallet } from 'common/types'
import React, { useCallback } from 'react'
import { setActiveAccount, selectActiveAccount } from 'store/account'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'expo-router'
import { NetworkVMType } from '@avalabs/vm-module-types'
import {
  P_CHAIN_ACCOUNT_NAME,
  X_CHAIN_ACCOUNT_NAME
} from 'store/account/consts'
import { GetAccountDataProps, GetXpAccountDataProps } from '../types'
import { AccountBalance } from '../components/AccountBalance'
import { XpAccountBalance } from '../components/XpAccountBalance'

export const useGetAccountData = (): {
  getAccountData: (props: GetAccountDataProps) => AccountDataForWallet
  getXpAccountData: (props: GetXpAccountDataProps) => AccountDataForWallet
} => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const { navigate, dismiss } = useRouter()
  const activeAccount = useSelector(selectActiveAccount)

  const handleSetActiveAccount = useCallback(
    (accountId: string) => {
      if (accountId === activeAccount?.id) {
        return
      }
      dispatch(setActiveAccount(accountId))
      dismiss()
      dismiss()
    },
    [activeAccount?.id, dispatch, dismiss]
  )

  const gotoAccountDetails = useCallback(
    (accountId: string): void => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/accountSettings/account',
        params: { accountId }
      })
    },
    [navigate]
  )

  const getAccountData = useCallback(
    ({
      hideSeparator,
      isActive,
      account,
      walletName
    }: GetAccountDataProps): AccountDataForWallet => {
      return {
        id: account.id,
        hideSeparator,
        containerSx: {
          backgroundColor: isActive
            ? alpha(colors.$textPrimary, 0.1)
            : 'transparent',
          borderRadius: 8
        },
        title: (
          <Text
            testID={`manage_accounts_list__${account.name}`}
            variant="body1"
            numberOfLines={2}
            sx={{
              color: colors.$textPrimary,
              fontSize: 14,
              lineHeight: 16,
              fontWeight: '500',
              width: SCREEN_WIDTH * 0.3
            }}>
            {account.name}
          </Text>
        ),
        subtitle: (
          <Text
            variant="mono"
            sx={{
              color: alpha(colors.$textPrimary, 0.6),
              fontSize: 13,
              lineHeight: 16,
              fontWeight: '500'
            }}>
            {truncateAddress(account.addressC, TRUNCATE_ADDRESS_LENGTH)}
          </Text>
        ),
        leftIcon: isActive ? (
          <Icons.Custom.CheckSmall
            color={colors.$textPrimary}
            width={24}
            height={24}
          />
        ) : (
          <View sx={{ width: 24 }} />
        ),
        value: <AccountBalance accountId={account.id} isActive={isActive} />,
        onPress: () => handleSetActiveAccount(account.id),
        accessory: (
          <TouchableOpacity
            hitSlop={16}
            sx={{ marginLeft: 4 }}
            onPress={() => gotoAccountDetails(account.id)}>
            <Icons.Alert.AlertCircle
              testID={
                walletName
                  ? `account_detail_icon__${walletName}_${account.name}`
                  : `account_detail_icon__${account.name}`
              }
              color={colors.$textSecondary}
              width={18}
              height={18}
            />
          </TouchableOpacity>
        )
      }
    },
    [
      colors.$textPrimary,
      colors.$textSecondary,
      gotoAccountDetails,
      handleSetActiveAccount
    ]
  )

  const getXpAccountData = useCallback(
    ({
      hideSeparator,
      isActive,
      accountId,
      numberOfAddresses
    }: GetXpAccountDataProps): AccountDataForWallet => {
      const isPvm = accountId === NetworkVMType.PVM
      const accountName = isPvm ? P_CHAIN_ACCOUNT_NAME : X_CHAIN_ACCOUNT_NAME
      return {
        id: accountId,
        hideSeparator,
        containerSx: {
          backgroundColor: isActive
            ? alpha(colors.$textPrimary, 0.1)
            : 'transparent',
          borderRadius: 8
        },
        title: (
          <>
            <View
              sx={{
                width: 14,
                height: 14,
                backgroundColor: colors.$borderPrimary,
                borderRadius: 4,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              <Text
                variant="body1"
                sx={{
                  color: colors.$textPrimary,
                  fontSize: 9,
                  lineHeight: 12,
                  fontWeight: '700'
                }}>
                {isPvm ? 'P' : 'X'}
              </Text>
            </View>
            <Text
              testID={`manage_accounts_list__${isPvm ? 'PVM' : 'AVM'}`}
              variant="body1"
              numberOfLines={1}
              sx={{
                color: colors.$textPrimary,
                fontSize: 14,
                lineHeight: 16,
                fontWeight: '500',
                width: SCREEN_WIDTH * 0.3
              }}>
              {accountName}
            </Text>
          </>
        ),
        subtitle: (
          <Text
            variant="mono"
            sx={{
              color: alpha(colors.$textPrimary, 0.6),
              fontSize: 13,
              lineHeight: 16,
              fontWeight: '500'
            }}>
            {numberOfAddresses}
            {numberOfAddresses > 1 ? ' addresses' : ' address'}
          </Text>
        ),
        leftIcon: isActive ? (
          <Icons.Custom.CheckSmall
            color={colors.$textPrimary}
            width={24}
            height={24}
          />
        ) : (
          <View sx={{ width: 24 }} />
        ),
        value: (
          <XpAccountBalance
            isActive={isActive}
            walletId={accountId}
            networkType={isPvm ? NetworkVMType.PVM : NetworkVMType.AVM}
          />
        ),
        onPress: () => handleSetActiveAccount(accountId),
        accessory: <View sx={{ marginLeft: 4, width: 24, height: 24 }} />
      }
    },
    [colors.$borderPrimary, colors.$textPrimary, handleSetActiveAccount]
  )

  return {
    getAccountData,
    getXpAccountData
  }
}
