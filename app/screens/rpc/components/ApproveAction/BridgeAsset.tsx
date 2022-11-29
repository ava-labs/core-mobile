import React, { FC, useContext } from 'react'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { GenericAction } from 'services/walletconnect/types'
import { humanize } from 'utils/string/humanize'

interface Props {
  action: GenericAction
}

const BridgeAsset: FC<Props> = ({ action }) => {
  const theme = useContext(ApplicationContext).theme
  const { displayData } = action
  const amountStr = displayData?.amountStr
  const symbol = displayData?.asset?.symbol
  const currentBlockchain = displayData?.currentBlockchain

  return (
    <View style={{ flex: 1 }}>
      <AvaText.Body2
        color={theme.colorError}
        textStyle={{ alignSelf: 'center' }}>
        Core wants to bridge
      </AvaText.Body2>
      <Space y={8} />
      <AvaText.Body2>Message:</AvaText.Body2>
      <Space y={8} />
      <ScrollView
        style={{
          maxHeight: 250,
          backgroundColor: theme.colorBg3,
          borderRadius: 8,
          padding: 8
        }}>
        <AvaText.Body1>{`You are about to bridge ${amountStr} ${symbol} on ${humanize(
          currentBlockchain
        )} Network`}</AvaText.Body1>
      </ScrollView>
    </View>
  )
}

export default BridgeAsset
