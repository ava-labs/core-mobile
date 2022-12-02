import React, { FC } from 'react'
import { WalletSwitchEthereumChainRpcRequest } from 'store/rpc/handlers/wallet_switchEthereumChain'
import Avatar from 'components/Avatar'
import { WalletAddEthereumChainRpcRequest } from 'store/rpc/handlers/wallet_addEthereumChain'
import { DappRpcRequests } from 'store/rpc'
import SimplePrompt from './SimplePrompt'

interface Props {
  dappEvent:
    | WalletSwitchEthereumChainRpcRequest
    | WalletAddEthereumChainRpcRequest
  onReject: (request: DappRpcRequests) => void
  onApprove: (request: DappRpcRequests) => void
  onClose: (request: DappRpcRequests) => void
}

const SwitchEthereumChain: FC<Props> = ({
  dappEvent,
  onApprove,
  onReject,
  onClose
}) => {
  const network = dappEvent.network
  const peerMeta = dappEvent.payload.peerMeta

  const header = `Switch to ${network.chainName} Network?`

  const description = `${
    new URL(peerMeta?.url ?? '').hostname
  } is requesting to switch your active network to ${network.chainName}`

  const renderIcon = () => (
    <Avatar.Custom
      name={peerMeta?.name ?? ''}
      size={48}
      logoUri={peerMeta?.icons[0]}
    />
  )

  return (
    <SimplePrompt
      onApprove={() => onApprove(dappEvent)}
      onReject={() => {
        onReject(dappEvent)
        onClose(dappEvent)
      }}
      header={header}
      description={description}
      renderIcon={renderIcon}
    />
  )
}

export default SwitchEthereumChain
