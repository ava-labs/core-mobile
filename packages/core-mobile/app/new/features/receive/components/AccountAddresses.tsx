import { useSelector } from 'react-redux'

import { Button, GroupList, useTheme } from '@avalabs/k2-alpine'
import { copyToClipboard } from 'common/utils/clipboard'
import React, { memo, useMemo } from 'react'
import {
  NETWORK_P,
  NETWORK_P_TEST,
  NETWORK_X,
  NETWORK_X_TEST
} from 'services/network/consts'
import { selectActiveAccount } from 'store/account'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { isXPChain } from 'utils/network/isAvalancheNetwork'
import { truncateAddress } from '@avalabs/core-utils-sdk'
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

      if (isXPChain(selectedNetwork.chainId)) {
        const networkX = selectedNetwork.isTestnet ? NETWORK_X_TEST : NETWORK_X
        const networkP = selectedNetwork.isTestnet ? NETWORK_P_TEST : NETWORK_P
        const addressP = activeAccount?.addressPVM ?? ''
        const addressX = activeAccount?.addressAVM ?? ''

        return [
          {
            title: networkX.chainName.replace('-', '\u2011'),
            subtitle: truncateAddress(addressX).replace('-', '\u2011'), // to prevent word wrap because of the dash
            leftIcon: (
              <NetworkLogoWithChain
                network={networkX}
                outerBorderColor={theme.colors.$surfaceSecondary}
                showChainLogo
              />
            ),
            value: (
              <Button
                type="secondary"
                size="small"
                onPress={() =>
                  onCopyAddress(
                    addressX,
                    `${networkX.chainName} address copied`
                  )
                }>
                Copy
              </Button>
            )
          },
          {
            title: networkP.chainName.replace('-', '\u2011'),
            subtitle: truncateAddress(addressP).replace('-', '\u2011'), // to prevent word wrap because of the dash
            leftIcon: (
              <NetworkLogoWithChain
                network={networkP}
                outerBorderColor={theme.colors.$surfaceSecondary}
                showChainLogo
              />
            ),
            value: (
              <Button
                type="secondary"
                size="small"
                onPress={() =>
                  onCopyAddress(
                    addressP,
                    `${networkP.chainName} address copied`
                  )
                }>
                Copy
              </Button>
            )
          }
        ]
      }

      return [
        {
          title: selectedNetwork.chainName.replace('-', '\u2011'),
          subtitle: truncateAddress(address).replace('-', '\u2011'),
          leftIcon: (
            <NetworkLogoWithChain
              network={selectedNetwork}
              outerBorderColor={theme.colors.$surfaceSecondary}
              showChainLogo={false}
            />
          ),
          value: (
            <Button
              type="secondary"
              size="medium"
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

    return <GroupList data={walletAddreses} textContainerSx={{ flex: 2 }} />
  }
)
