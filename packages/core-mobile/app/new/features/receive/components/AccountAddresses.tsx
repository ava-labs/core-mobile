import { useSelector } from 'react-redux'
import { Button, GroupList, useTheme } from '@avalabs/k2-alpine'
import { copyToClipboard } from 'common/utils/clipboard'
import React, { memo, useMemo } from 'react'
import { selectActiveAccount } from 'store/account'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { isXPChain } from 'utils/network/isAvalancheNetwork'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { useReceiveSelectedNetwork } from '../store'

export const AccountAddresses = memo(
  ({ address }: { address: string }): React.JSX.Element => {
    const { theme } = useTheme()
    const activeAccount = useSelector(selectActiveAccount)
    const [selectedNetwork] = useReceiveSelectedNetwork()

    const onCopyAddress = (value: string, message: string): void => {
      copyToClipboard(value, message)
    }

    const walletAddreses = useMemo(() => {
      if (!activeAccount) return []

      return [
        {
          title: selectedNetwork.chainName.replace('-', '\u2011'),
          subtitle: truncateAddress(address, TRUNCATE_ADDRESS_LENGTH),
          leftIcon: (
            <NetworkLogoWithChain
              network={selectedNetwork}
              outerBorderColor={theme.colors.$surfaceSecondary}
              showChainLogo={isXPChain(selectedNetwork.chainId)}
            />
          ),
          value: (
            <Button
              type="secondary"
              size="medium"
              testID={`copy_btn__${selectedNetwork.chainName}`}
              onPress={() =>
                onCopyAddress(
                  address,
                  `${selectedNetwork.chainName} address copied`
                )
              }>
              Copy
            </Button>
          )
        }
      ]
    }, [
      activeAccount,
      selectedNetwork,
      address,
      theme.colors.$surfaceSecondary
    ])

    return (
      <GroupList
        data={walletAddreses}
        textContainerSx={{
          width: '65%'
        }}
      />
    )
  }
)
