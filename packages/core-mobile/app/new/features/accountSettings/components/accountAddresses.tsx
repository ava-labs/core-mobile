import React from 'react'
import { GroupList, useTheme, TouchableOpacity, Text } from '@avalabs/k2-alpine'
import { Account } from 'store/account'
import { copyToClipboard } from 'common/utils/clipboard'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { TokenLogo } from 'common/components/TokenLogo'
import { TokenSymbol } from 'store/network'
import { XPChainLogo } from '../../../common/components/XPChainLogo'

export const AccountAddresses = ({
  account
}: {
  account?: Account
}): React.JSX.Element => {
  const onCopyAddress = (value: string, message: string): void => {
    copyToClipboard(value, message)
  }

  const data = [
    {
      subtitle: truncateAddress(account.addressC),
      title: 'Avalanche C-Chain',
      leftIcon: <TokenLogo symbol={TokenSymbol.AVAX} size={24} />,
      value: (
        <CopyButton
          testID="copy_c_chain_address"
          onPress={() =>
            onCopyAddress(account.addressC, 'C-Chain address copied')
          }
        />
      )
    },
    {
      subtitle: truncateAddress(account.addressPVM),
      title: 'Avalanche P-Chain',
      leftIcon: <XPChainLogo networkType="PVM" />,
      value: (
        <CopyButton
          testID="copy_p_chain_address"
          onPress={() =>
            onCopyAddress(account.addressPVM, 'P-Chain address copied')
          }
        />
      )
    },
    {
      subtitle: truncateAddress(account.addressAVM),
      title: 'Avalanche X-Chain',
      leftIcon: <XPChainLogo networkType="AVM" />,
      value: (
        <CopyButton
          testID="copy_x_chain_address"
          onPress={() =>
            onCopyAddress(account.addressAVM, 'X-Chain address copied')
          }
        />
      )
    },
    {
      subtitle: truncateAddress(account.addressC),
      title: 'Ethereum',
      leftIcon: <TokenLogo symbol={TokenSymbol.ETH} size={24} />,
      value: (
        <CopyButton
          testID="copy_ethereum_address"
          onPress={() =>
            onCopyAddress(account.addressC, 'Ethereum address copied')
          }
        />
      )
    },
    {
      subtitle: truncateAddress(account.addressBTC),
      title: 'Bitcoin',
      leftIcon: <TokenLogo symbol={TokenSymbol.BTC} size={24} />,
      value: (
        <CopyButton
          testID="copy_bitcoin_address"
          onPress={() =>
            onCopyAddress(account.addressBTC, 'Bitcoin address copied')
          }
        />
      )
    }
  ]

  return (
    <GroupList
      data={data}
      titleSx={{ fontSize: 15, lineHeight: 18, fontFamily: 'Inter-Regular' }}
      subtitleSx={{ fontSize: 13, lineHeight: 18 }}
      textContainerSx={{ paddingVertical: 9 }}
      valueSx={{ fontSize: 16, lineHeight: 22 }}
    />
  )
}

const CopyButton = ({
  onPress,
  testID
}: {
  onPress: () => void
  testID?: string
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.$borderPrimary,
        paddingHorizontal: 17,
        paddingVertical: 5,
        borderRadius: 17
      }}>
      <Text testID={testID} variant="buttonMedium" sx={{ fontSize: 14 }}>
        Copy
      </Text>
    </TouchableOpacity>
  )
}
