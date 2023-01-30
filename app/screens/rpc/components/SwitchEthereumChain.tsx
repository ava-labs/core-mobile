import React, { FC, useCallback } from 'react'
import { WalletSwitchEthereumChainRpcRequest } from 'store/walletConnect/handlers/wallet_switchEthereumChain'
import Avatar from 'components/Avatar'
import { WalletAddEthereumChainRpcRequest } from 'store/walletConnect/handlers/wallet_addEthereumChain'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useDappConnectionContext } from 'contexts/DappConnectionContext'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Network } from '@avalabs/chains-sdk'
import SimplePrompt from './SimplePrompt'

interface Props {
  request:
    | WalletSwitchEthereumChainRpcRequest
    | WalletAddEthereumChainRpcRequest
  network: Network
  onReject: () => void
  onApprove: () => void
}

type SwitchEthereumChainScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.SwitchEthereumChain
>

export const SwitchEthereumChain = () => {
  const { goBack } =
    useNavigation<SwitchEthereumChainScreenProps['navigation']>()
  const { request, network } =
    useRoute<SwitchEthereumChainScreenProps['route']>().params
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionContext()

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { network })
    goBack()
  }, [goBack, network, onApprove, request])

  return (
    <SwitchEthereumChainView
      request={request}
      network={network}
      onApprove={approveAndClose}
      onReject={rejectAndClose}
    />
  )
}

export const SwitchEthereumChainView: FC<Props> = ({
  request,
  network,
  onApprove,
  onReject
}) => {
  const peerMeta = request.payload.peerMeta

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
      onApprove={onApprove}
      onReject={onReject}
      header={header}
      description={description}
      renderIcon={renderIcon}
    />
  )
}

export default SwitchEthereumChain
