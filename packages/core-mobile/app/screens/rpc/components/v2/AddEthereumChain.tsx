import React, { useCallback } from 'react'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { SwitchEthereumChainView } from '../shared/SwitchEthereumChainView'
import AddEthereumChainView from '../shared/AddEthereumChainView'

type AddEthereumChainScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.AddEthereumChainV2
>

const AddEthereumChain = () => {
  const { goBack } = useNavigation<AddEthereumChainScreenProps['navigation']>()

  const { request, network, isExisting } =
    useRoute<AddEthereumChainScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { network, isExisting })
    goBack()
  }, [goBack, isExisting, network, onApprove, request])

  const peerMeta = request.peerMeta
  const dappUrl = peerMeta.url
  const dappName = peerMeta.name
  const dappLogo = peerMeta.icons[0]

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
      dappName={peerMeta.name}
      dappLogo={peerMeta.icons[0]}
      network={network}
      onApprove={approveAndClose}
      onReject={rejectAndClose}
    />
  )
}

export default AddEthereumChain
