import React, { useMemo } from 'react'
import {
  GroupList,
  useTheme,
  TouchableOpacity,
  Text,
  View,
  SCREEN_WIDTH
} from '@avalabs/k2-alpine'
import { Account } from 'store/account'
import { copyToClipboard } from 'common/utils/clipboard'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { useCombinedPrimaryNetworks } from 'common/hooks/useCombinedPrimaryNetworks'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { isXPChain } from 'utils/network/isAvalancheNetwork'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'

export const AccountAddresses = ({
  account
}: {
  account: Account
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { networks } = useCombinedPrimaryNetworks()

  const onCopyAddress = (value: string, message: string): void => {
    copyToClipboard(value, message)
  }

  const data = useMemo(() => {
    return networks.map(network => {
      const address = (() => {
        switch (network.vmName) {
          case NetworkVMType.AVM:
          case NetworkVMType.PVM:
            return account.addressPVM.replace(/^[XP]-/, '')
          case NetworkVMType.BITCOIN:
            return account.addressBTC
          case NetworkVMType.EVM:
            return account.addressC
          case NetworkVMType.SVM:
            return account.addressSVM
          default:
            return undefined
        }
      })()

      return {
        subtitle: address
          ? truncateAddress(address, TRUNCATE_ADDRESS_LENGTH)
          : '',
        title: network.chainName,
        leftIcon: (
          <NetworkLogoWithChain
            network={network}
            networkSize={36}
            outerBorderColor={colors.$surfaceSecondary}
            showChainLogo={isXPChain(network.chainId)}
          />
        ),
        value: (
          <CopyButton
            testID={`copy_btn__${network.chainName}`}
            onPress={() =>
              address &&
              onCopyAddress(address, `${network.chainName} address copied`)
            }
          />
        )
      }
    })
  }, [
    account.addressBTC,
    account.addressC,
    account.addressPVM,
    account.addressSVM,
    colors.$surfaceSecondary,
    networks
  ])

  return (
    <GroupList
      data={data}
      titleSx={{
        fontSize: 15,
        lineHeight: 18,
        fontFamily: 'Inter-Medium'
      }}
      subtitleSx={{ fontSize: 13, lineHeight: 18 }}
      textContainerSx={{
        width: SCREEN_WIDTH * 0.4
      }}
      valueSx={{
        fontSize: 16,
        lineHeight: 22
      }}
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
    <View style={{ marginLeft: 16 }}>
      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: colors.$borderPrimary,
          paddingHorizontal: 17,
          paddingVertical: 5,
          borderRadius: 17
        }}>
        <Text
          testID={testID}
          variant="buttonMedium"
          sx={{ fontSize: 14 }}
          numberOfLines={1}>
          Copy
        </Text>
      </TouchableOpacity>
    </View>
  )
}
