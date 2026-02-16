import { skipToken, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import { useMemo } from 'react'
import { Account, XPAddressDictionary } from 'store/account/types'
import { getAddressesFromXpubXP } from 'utils/getAddressesFromXpubXP/getAddressesFromXpubXP'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectWalletById } from 'store/wallet/slice'
import { queryClient } from 'contexts/ReactQueryProvider'
import { WalletType } from 'services/wallet/types'
import Logger from 'utils/Logger'
import { transformXPAddresses } from './transformXPAddresses'

const STALE_TIME = 60 * 1000 // 1 minute

const EMPTY_XP_ADDRESSES = {
  xpAddresses: [] as string[],
  xpAddressDictionary: {} as XPAddressDictionary
}

const getQueryKey = ({
  walletId,
  walletType,
  accountIndex,
  accountId,
  isDeveloperMode
}: {
  walletId: string
  walletType: WalletType | string
  accountIndex: number
  accountId: string
  isDeveloperMode: boolean
}): readonly [string, string, WalletType | string, number, string, boolean] => {
  return [
    ReactQueryKeys.XP_ADDRESSES,
    walletId,
    walletType,
    accountIndex,
    accountId,
    isDeveloperMode
  ]
}

export const useXPAddresses = (
  account?: Account
): {
  xpAddresses: string[]
  xpAddressDictionary: XPAddressDictionary
  isLoading: boolean
} => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const wallet = useSelector(selectWalletById(account?.walletId ?? ''))

  const walletId = wallet?.id ?? ''
  const walletType = wallet?.type ?? ''
  const accountIndex = account?.index ?? 0
  const accountId = account?.id ?? ''

  const shouldDisable = !wallet || !account

  // TODO: https://ava-labs.atlassian.net/browse/CP-13335
  // Keystone SDK currently only exposes a single XP xpub (account index 0)
  // for all accounts.  Until their SDK supports per-account xpubs, non-primary
  // accounts must return empty to avoid duplicate XP balances caused by the
  // addressPVM fallback in transformXPAddresses.
  // Remove this workaround once the Keystone SDK is fixed.
  const isKeystoneNonPrimary =
    walletType === WalletType.KEYSTONE && accountIndex > 0

  const queryResult = useQuery({
    staleTime: STALE_TIME,
    queryKey: getQueryKey({
      walletId,
      walletType,
      accountIndex,
      accountId,
      isDeveloperMode
    }),
    queryFn:
      shouldDisable || isKeystoneNonPrimary
        ? skipToken
        : () => {
            return getAddressesFromXpubXP({
              isDeveloperMode,
              walletId,
              walletType: walletType as WalletType,
              accountIndex,
              onlyWithActivity: true
            })
          }
  })

  const transformed = useMemo(
    () => transformXPAddresses(queryResult.data, account),
    [queryResult.data, account]
  )

  return {
    ...(isKeystoneNonPrimary ? EMPTY_XP_ADDRESSES : transformed),
    isLoading: queryResult.isLoading
  }
}

export async function getCachedXPAddresses({
  walletId,
  walletType,
  account,
  isDeveloperMode
}: {
  walletId: string
  walletType: WalletType
  account: Account
  isDeveloperMode: boolean
}): Promise<{
  xpAddresses: string[]
  xpAddressDictionary: XPAddressDictionary
}> {
  // TODO: https://ava-labs.atlassian.net/browse/CP-13335
  // Remove once the Keystone SDK supports per-account XP xpubs.
  if (walletType === WalletType.KEYSTONE && account.index > 0) {
    return EMPTY_XP_ADDRESSES
  }

  try {
    const result = await queryClient.fetchQuery({
      staleTime: STALE_TIME,
      queryKey: getQueryKey({
        walletId,
        walletType,
        accountIndex: account.index,
        accountId: account.id,
        isDeveloperMode
      }),
      queryFn: () =>
        getAddressesFromXpubXP({
          isDeveloperMode,
          walletId,
          walletType,
          accountIndex: account.index,
          onlyWithActivity: true
        })
    })

    return transformXPAddresses(result, account)
  } catch (error) {
    Logger.error('getCachedXPAddresses failed', error)
    return {
      xpAddresses: [],
      xpAddressDictionary: {}
    }
  }
}
