import React, { useCallback, useEffect } from 'react'
import AccountApproval from 'screens/rpc/components/AccountApproval'
import SignTransaction from 'screens/rpc/components/SignTransaction'
import SignMessage from 'screens/rpc/components/SignMessage/SignMessage'
import { useDappConnectionContext } from 'contexts/DappConnectionContext'
import { useNavigation } from '@react-navigation/native'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import AvaxSheetHandle from 'components/AvaxSheetHandle'
import TabViewBackground from 'components/TabViewBackground'
import { RpcMethod } from 'services/walletconnect/types'
import { useDispatch, useSelector } from 'react-redux'
import { removeRequest, selectRpcRequests } from 'store/rpc'
import { EthSendTransactionRpcRequest } from 'store/rpc/handlers/eth_sendTransaction'
import { EthSignRpcRequest } from 'store/rpc/handlers/eth_sign'
import { SessionRequestRpcRequest } from 'store/rpc/handlers/session_request'
import { AvalancheUpdateContactRequest } from 'store/rpc/handlers/avalanche_updateContact'
import { WalletSwitchEthereumChainRpcRequest } from 'store/rpc/handlers/wallet_switchEthereumChain'
import { WalletAddEthereumChainRpcRequest } from 'store/rpc/handlers/wallet_addEthereumChain'
import UpdateContact from './components/UpdateContact'
import SwitchEthereumChain from './components/SwitchEthereumChain'
import AddEthereumChain from './components/AddEthereumChain'

const snapPoints = ['90%']

const RpcMethodsUI = () => {
  const dispatch = useDispatch()
  const { goBack } = useNavigation()
  const { onUserApproved, onUserRejected } = useDappConnectionContext()
  const rpcRequests = useSelector(selectRpcRequests)
  const oldestRpcRequest = rpcRequests[0]

  useEffect(() => {
    if (rpcRequests === undefined || !rpcRequests.length) {
      goBack()
    }
  }, [goBack, rpcRequests])

  const onClose = useCallback(() => {
    if (oldestRpcRequest) {
      dispatch(removeRequest(oldestRpcRequest.payload.id))
    }
    goBack()
  }, [dispatch, goBack, oldestRpcRequest])

  const renderContent = () => {
    if (!oldestRpcRequest) return null

    switch (oldestRpcRequest.payload.method) {
      case RpcMethod.ETH_SIGN:
      case RpcMethod.SIGN_TYPED_DATA:
      case RpcMethod.SIGN_TYPED_DATA_V1:
      case RpcMethod.SIGN_TYPED_DATA_V3:
      case RpcMethod.SIGN_TYPED_DATA_V4:
      case RpcMethod.PERSONAL_SIGN:
        return (
          <SignMessage
            onReject={onUserRejected}
            onApprove={onUserApproved}
            dappEvent={oldestRpcRequest as EthSignRpcRequest}
            onClose={onClose}
          />
        )
      case RpcMethod.SESSION_REQUEST:
        return (
          <AccountApproval
            onReject={onUserRejected}
            onApprove={onUserApproved}
            dappEvent={oldestRpcRequest as SessionRequestRpcRequest}
            onClose={onClose}
          />
        )
      case RpcMethod.ETH_SEND_TRANSACTION:
        return (
          <SignTransaction
            onReject={onUserRejected}
            onApprove={onUserApproved}
            dappEvent={oldestRpcRequest as EthSendTransactionRpcRequest}
            onClose={onClose}
          />
        )
      case RpcMethod.AVALANCHE_UPDATE_CONTACT:
        return (
          <UpdateContact
            onReject={onUserRejected}
            onApprove={onUserApproved}
            dappEvent={oldestRpcRequest as AvalancheUpdateContactRequest}
            onClose={onClose}
          />
        )
      case RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN:
        return (
          <SwitchEthereumChain
            onReject={onUserRejected}
            onApprove={onUserApproved}
            dappEvent={oldestRpcRequest as WalletSwitchEthereumChainRpcRequest}
            onClose={onClose}
          />
        )
      case RpcMethod.WALLET_ADD_ETHEREUM_CHAIN:
        return (
          <AddEthereumChain
            onReject={onUserRejected}
            onApprove={onUserApproved}
            dappEvent={oldestRpcRequest as WalletAddEthereumChainRpcRequest}
            onClose={onClose}
          />
        )
      default:
        return null
    }
  }

  return (
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      animateOnMount
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundComponent={TabViewBackground}
      enableContentPanningGesture={false}
      onClose={() => {
        onClose()
      }}>
      {renderContent()}
    </BottomSheet>
  )
}

export default RpcMethodsUI
