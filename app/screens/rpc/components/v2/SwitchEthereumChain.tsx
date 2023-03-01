import React, { useCallback } from 'react'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { SwitchEthereumChainView } from '../shared/SwitchEthereumChainView'

type SwitchEthereumChainScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.SwitchEthereumChainV2
>

export const SwitchEthereumChain = () => {
  const { goBack } =
    useNavigation<SwitchEthereumChainScreenProps['navigation']>()

  const { request, network } =
    useRoute<SwitchEthereumChainScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { network })
    goBack()
  }, [goBack, network, onApprove, request])

  const peerMeta = request.session.peer.metadata
  const dappUrl = peerMeta.url
  const dappName = peerMeta.name
  const dappLogo = peerMeta.icons[0]

  return (
    <SwitchEthereumChainView
      network={network}
      onApprove={approveAndClose}
      onReject={rejectAndClose}
      dappUrl={dappUrl}
      dappName={dappName}
      dappLogo={dappLogo}
    />
  )
}

export default SwitchEthereumChain
