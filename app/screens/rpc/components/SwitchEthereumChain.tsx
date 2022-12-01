import AvaText from 'components/AvaText'
import React, { FC } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import { WalletSwitchEthereumChainRpcRequest } from 'store/rpc/handlers/wallet_switchEthereumChain'
import Avatar from 'components/Avatar'
import { WalletAddEthereumChainRpcRequest } from 'store/rpc/handlers/wallet_addEthereumChain'
import { DappRpcRequests } from 'store/rpc'

interface Props {
  dappEvent:
    | WalletSwitchEthereumChainRpcRequest
    | WalletAddEthereumChainRpcRequest
  onReject: (request: DappRpcRequests) => void
  onApprove: (request: DappRpcRequests) => void
  onClose: () => void
}

const SwitchEthereumChain: FC<Props> = ({
  dappEvent,
  onApprove,
  onReject,
  onClose
}) => {
  const theme = useApplicationContext().theme
  const network = dappEvent.network
  const peerMeta = dappEvent.payload.peerMeta

  return (
    <NativeViewGestureHandler>
      <SafeAreaView style={styles.safeView}>
        <AvaText.LargeTitleBold>
          Switch to {network.chainName} Network?
        </AvaText.LargeTitleBold>
        <Space y={35} />
        <View style={styles.subTitleView}>
          <OvalTagBg
            style={{
              height: 80,
              width: 80,
              backgroundColor: theme.colorBg3
            }}>
            <Avatar.Custom
              name={peerMeta?.name ?? ''}
              size={48}
              logoUri={peerMeta?.icons[0]}
            />
          </OvalTagBg>
          <Space y={15} />
          <AvaText.Body1 textStyle={styles.subTitleText}>
            {new URL(peerMeta?.url ?? '').hostname} is requesting to switch your
            active network to {network.chainName}
          </AvaText.Body1>
          <Space y={16} />
        </View>
        <Space y={30} />
        <FlexSpacer />
        <View style={styles.actionContainer}>
          <AvaButton.PrimaryMedium onPress={() => onApprove(dappEvent)}>
            Approve
          </AvaButton.PrimaryMedium>
          <Space y={21} />
          <AvaButton.SecondaryMedium
            onPress={() => {
              onReject(dappEvent)
              onClose()
            }}>
            Reject
          </AvaButton.SecondaryMedium>
        </View>
      </SafeAreaView>
    </NativeViewGestureHandler>
  )
}

const styles = StyleSheet.create({
  safeView: {
    paddingTop: 32,
    flex: 1,
    paddingHorizontal: 16
  },
  subTitleView: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  subTitleText: {
    textAlign: 'center'
  },
  actionContainer: {
    flex: 0,
    paddingVertical: 16,
    paddingHorizontal: 24
  }
})

export default SwitchEthereumChain
