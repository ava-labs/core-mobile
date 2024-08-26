import { Space } from 'components/Space'
import React from 'react'
import { Row } from 'components/Row'
import { useRoute } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import RpcRequestBottomSheet from 'screens/rpc/components/shared/RpcRequestBottomSheet'
import { View, Text } from '@avalabs/k2-mobile'
import AvaButton from 'components/AvaButton'
import CarrotSVG from 'components/svg/CarrotSVG'
import { getHexStringToBytes } from 'utils/getHexStringToBytes'

const TransactionDataScreen = (): JSX.Element | null => {
  const { data, onClose } =
    useRoute<TransactionDataScreenProps['route']>().params

  return (
    <RpcRequestBottomSheet onClose={onClose}>
      <View style={{ padding: 16 }}>
        <Row style={{ alignItems: 'center' }}>
          <AvaButton.Base onPress={onClose}>
            <CarrotSVG direction={'left'} size={23} />
          </AvaButton.Base>
          <Space x={14} />
          <Text variant="heading4">Transaction Data</Text>
        </Row>
        <Space y={16} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text variant="body1">Hex Data:</Text>
          <Text variant="body1">{getHexStringToBytes(data)} Bytes</Text>
        </Row>
        <View style={{ paddingVertical: 14 }}>
          <Text
            variant="body1"
            sx={{
              padding: 16,
              backgroundColor: '$neutral800',
              borderRadius: 15
            }}>
            {data}
          </Text>
        </View>
      </View>
    </RpcRequestBottomSheet>
  )
}

type TransactionDataScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.TransactionData
>

export default TransactionDataScreen
