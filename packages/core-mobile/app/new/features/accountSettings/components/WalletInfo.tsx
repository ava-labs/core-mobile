import React, { useMemo } from 'react'
import {
  useTheme,
  Text,
  GroupList,
  View,
  GroupListItem
} from '@avalabs/k2-alpine'
import { Account } from 'store/account'
import { CoreAccountType } from '@avalabs/types'
import { Wallet } from 'store/wallet/types'

export const WalletInfo = ({
  onShowPrivateKey,
  wallet,
  account
}: {
  onShowPrivateKey?: () => void
  wallet: Wallet
  account: Account
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const data = useMemo(() => {
    const results: GroupListItem[] = [
      {
        title: 'Type',
        value: (
          <Text
            variant="body2"
            sx={{
              color: colors.$textSecondary,
              fontSize: 16,
              lineHeight: 22,
              marginLeft: 9
            }}>
            {account?.type === CoreAccountType.IMPORTED
              ? 'Imported'
              : 'Primary'}
          </Text>
        )
      },
      {
        title: 'Wallet',
        value: (
          <Text
            variant="body2"
            sx={{
              color: colors.$textSecondary,
              fontSize: 16,
              lineHeight: 22,
              marginLeft: 9
            }}>
            {wallet?.name ?? 'Unknown Wallet'}
          </Text>
        )
      }
    ]

    if (onShowPrivateKey) {
      results.push({
        title: 'Show private key',
        onPress: onShowPrivateKey
      })
    }

    return results
  }, [account?.type, wallet?.name, onShowPrivateKey, colors.$textSecondary])

  return (
    <View sx={{ gap: 4 }}>
      <GroupList
        data={data}
        titleSx={{
          fontSize: 16,
          lineHeight: 22,
          fontFamily: 'Inter-Regular'
        }}
        valueSx={{ fontSize: 16, lineHeight: 22 }}
      />
      {onShowPrivateKey !== undefined && (
        <Text variant="caption" sx={{ color: colors.$textSecondary }}>
          Your account’s private key is a fixed password for accessing the
          specific addresses above. Keep it secure, anyone with this private key
          can access the account associated with it
        </Text>
      )}
    </View>
  )
}
