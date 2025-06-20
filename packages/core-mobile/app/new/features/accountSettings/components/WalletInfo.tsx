import React from 'react'
import { useTheme, Text, GroupList, View } from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectWalletById } from 'store/wallet/slice'
import { Account } from 'store/account'
import { CoreAccountType } from '@avalabs/types'

export const WalletInfo = ({
  showPrivateKey,
  account
}: {
  showPrivateKey: () => void
  account: Account
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const wallet = useSelector(selectWalletById(account?.walletId ?? ''))

  const data = [
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
          {account?.type === CoreAccountType.IMPORTED ? 'Imported' : 'Primary'}
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
    },
    {
      title: 'Show private key',
      onPress: showPrivateKey
    }
  ]

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
      <Text variant="caption" sx={{ color: colors.$textSecondary }}>
        Your account’s private key is a fixed password for accessing the
        specific addresses above. Keep it secure, anyone with this private key
        can access the account associated with it
      </Text>
    </View>
  )
}
