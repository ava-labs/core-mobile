import React, { useCallback } from 'react'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV1 } from 'hooks/useDappConnectionV1'
import { SwitchEthereumChainView } from '../shared/SwitchEthereumChainView'

type SwitchEthereumChainScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.SwitchEthereumChain
>

export const SwitchEthereumChain = () => {
  const { goBack } =
    useNavigation<SwitchEthereumChainScreenProps['navigation']>()
  const { request, network } =
    useRoute<SwitchEthereumChainScreenProps['route']>().params
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV1()

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { network })
    goBack()
  }, [goBack, network, onApprove, request])

  const dappUrl = request.payload.peerMeta?.url ?? ''
  const dappName = request.payload.peerMeta?.name ?? ''
  const dappLogo = request.payload.peerMeta?.icons[0]

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
