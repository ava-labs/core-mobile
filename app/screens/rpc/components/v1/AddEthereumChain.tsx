import React, { useCallback } from 'react'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV1 } from 'hooks/useDappConnectionV1'
import { SwitchEthereumChainView } from '../shared/SwitchEthereumChainView'
import AddEthereumChainView from '../shared/AddEthereumChainView'

type AddEthereumChainScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.AddEthereumChain
>

const AddEthereumChain = () => {
  const { goBack } = useNavigation<AddEthereumChainScreenProps['navigation']>()
  const { request, network, isExisting } =
    useRoute<AddEthereumChainScreenProps['route']>().params
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV1()

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { network, isExisting })
    goBack()
  }, [goBack, isExisting, network, onApprove, request])

  const dappUrl = request.payload.peerMeta?.url ?? ''
  const dappName = request.payload.peerMeta?.name ?? ''
  const dappLogo = request.payload.peerMeta?.icons[0]

  if (isExisting) {
    return (
      <SwitchEthereumChainView
        dappUrl={dappUrl}
        dappName={dappName}
        dappLogo={dappLogo}
        network={network}
        onApprove={approveAndClose}
        onReject={rejectAndClose}
      />
    )
  }

  return (
    <AddEthereumChainView
      dappName={dappName}
      dappLogo={dappLogo}
      network={network}
      onApprove={approveAndClose}
      onReject={rejectAndClose}
    />
  )
}

export default AddEthereumChain
