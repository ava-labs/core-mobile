import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { selectActiveNetwork, setActive } from 'store/network'
import { View } from 'react-native'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import FlexSpacer from 'components/FlexSpacer'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import TextFieldBg from 'components/styling/TextFieldBg'
import { Network } from '@avalabs/chains-sdk'

type Props = {
  network: Network
}

export default function NetworkDetails({ network }: Props) {
  const { rpcUrl, chainId, networkToken } = network
  const activeNetwork = useSelector(selectActiveNetwork)
  const dispatch = useDispatch()

  const isConnected = activeNetwork.chainId === chainId

  function connect() {
    dispatch(setActive(chainId))
  }

  return (
    <SafeAreaProvider style={{ flex: 1, padding: 16 }}>
      <View style={{ alignItems: 'center' }}>
        <AvaLogoSVG size={80} />
        <Space y={24} />
        <AvaText.Heading2>{network.chainName}</AvaText.Heading2>
      </View>
      <Space y={40} />
      <DetailItem title={'Network RPC URL'} value={rpcUrl} />
      <Space y={24} />
      <DetailItem title={'Chain ID'} value={chainId.toString()} />
      <Space y={24} />
      <DetailItem title={'Native Token'} value={networkToken.name} />
      <Space y={24} />
      <DetailItem title={'Explorer URL'} value={activeNetwork.explorerUrl} />
      <FlexSpacer />
      <AvaButton.PrimaryLarge disabled={isConnected} onPress={connect}>
        {isConnected ? 'Connected' : 'Connect'}
      </AvaButton.PrimaryLarge>
    </SafeAreaProvider>
  )
}

function DetailItem({ title, value }: { title: string; value: string }) {
  const { theme } = useApplicationContext()

  return (
    <>
      <AvaText.Body1>{title}</AvaText.Body1>
      <Space y={8} />
      <TextFieldBg>
        <AvaText.ButtonMedium textStyle={{ color: theme.colorText1 }}>
          {value}
        </AvaText.ButtonMedium>
      </TextFieldBg>
    </>
  )
}
