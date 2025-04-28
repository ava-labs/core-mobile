import React from 'react'
import { useTheme, Text, GroupList, View } from '@avalabs/k2-alpine'

export const WalletInfo = ({
  showPrivateKey
}: {
  showPrivateKey: () => void
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

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
          {/* TODO: CP-10070 */}
          {'Imported'}
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
          {/* TODO: CP-10070 */}
          {'Test wallet'}
        </Text>
      )
    }
    // {
    //   title: 'Show private key',
    //   onPress: showPrivateKey
    // }
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
      {/* <Text variant="caption" sx={{ color: colors.$textSecondary }}>
        Your account’s private key is a fixed password for accessing the
        specific addresses above. Keep it secure, anyone with this private key
        can access the account associated with it
      </Text> */}
    </View>
  )
}
