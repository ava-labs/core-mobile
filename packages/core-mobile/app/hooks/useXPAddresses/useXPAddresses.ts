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

  const queryResult = useQuery({
    staleTime: STALE_TIME,
    queryKey: getQueryKey({
      walletId,
      walletType,
      accountIndex,
      accountId,
      isDeveloperMode
    }),
    queryFn: shouldDisable
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
    ...transformed,
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
