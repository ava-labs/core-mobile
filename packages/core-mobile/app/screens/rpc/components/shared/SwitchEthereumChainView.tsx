import React, { FC } from 'react'
import Avatar from 'components/Avatar'
import { Network } from '@avalabs/chains-sdk'
import SimplePrompt from '../shared/SimplePrompt'

interface Props {
  dappUrl: string
  dappName: string
  dappLogo: string | undefined
  network: Network
  onReject: () => void
  onApprove: () => void
}

export const SwitchEthereumChainView: FC<Props> = ({
  dappUrl,
  dappName,
  dappLogo,
  network,
  onApprove,
  onReject
}) => {
  const header = `Switch to ${network.chainName} Network?`

  const description = `${
    new URL(dappUrl).hostname
  } is requesting to switch your active network to ${network.chainName}`

  const renderIcon = () => (
    <Avatar.Custom name={dappName} size={48} logoUri={dappLogo} />
  )

  return (
    <SimplePrompt
      onApprove={onApprove}
      onReject={onReject}
      header={header}
      description={description}
      renderIcon={renderIcon}
    />
  )
}
