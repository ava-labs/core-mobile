import { Network } from '@avalabs/core-chains-sdk'
import { Chip, useTheme } from '@avalabs/k2-alpine'
import { DropdownMenu } from 'common/components/DropdownMenu'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { DropdownSelection } from 'common/types'
import React, { useCallback } from 'react'

interface NetworkFilterDropdownProps {
  network: Network
  title: DropdownSelection['title']
  data: DropdownSelection['data']
  onSelected: DropdownSelection['onSelected']
}

export const NetworkFilterDropdown = ({
  network,
  title,
  data,
  onSelected
}: NetworkFilterDropdownProps): JSX.Element => {
  const { theme } = useTheme()

  const renderLeftIcon = useCallback(() => {
    if (!network) return <></>

    return (
      <NetworkLogoWithChain
        network={network}
        networkSize={18}
        outerBorderColor={theme.colors.$surfaceSecondary}
        showChainLogo={false}
      />
    )
  }, [network, theme.colors.$surfaceSecondary])

  return (
    <DropdownMenu
      groups={data}
      onPressAction={(event: { nativeEvent: { event: string } }) =>
        onSelected(event.nativeEvent.event)
      }>
      <Chip
        renderLeft={renderLeftIcon}
        style={{
          paddingLeft: 6,
          paddingRight: 10,
          gap: 4
        }}
        size="large"
        hitSlop={8}
        testID="network_dropdown_btn">
        {title}
      </Chip>
    </DropdownMenu>
  )
}
