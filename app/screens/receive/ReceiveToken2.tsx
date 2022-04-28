import React, { FC, memo, useCallback } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { usePortfolio } from 'screens/portfolio/usePortfolio'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { useFocusEffect } from '@react-navigation/native'
import AvaxQACode from 'components/AvaxQRCode'
import TokenAddress from 'components/TokenAddress'

type Props = {
  isXChain?: boolean
  onShare?: (address: string) => void
  positionCallback?: (position: number) => void
  embedded: boolean
}

const ReceiveToken2: FC<Props> = memo(props => {
  const { addressC: selectedAddress } = usePortfolio()
  const theme = useApplicationContext().theme
  const isXChain = !!props?.isXChain
  const embedded = !!props?.embedded

  useFocusEffect(
    useCallback(() => {
      props?.positionCallback?.(isXChain ? 1 : 0)
    }, [])
  )

  return (
    <View
      style={{
        flex: 1
      }}>
      <Space y={embedded ? 34 : 8} />
      {embedded || (
        <>
          <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
            Receive
          </AvaText.LargeTitleBold>
          <Space y={12} />
        </>
      )}
      <Text style={{ marginHorizontal: 16, paddingTop: 4 }}>
        <AvaText.Body2>This is your </AvaText.Body2>
        <AvaText.Heading3>
          {isXChain ? 'X chain ' : 'C chain '}
        </AvaText.Heading3>
        <AvaText.Body2>address to receive funds.</AvaText.Body2>
      </Text>
      <View style={[styles.container]}>
        <Space y={55} />
        <View style={{ alignSelf: 'center' }}>
          <AvaxQACode
            circularText={isXChain ? 'X Chain' : 'C Chain'}
            sizePercentage={0.7}
            address={selectedAddress}
          />
        </View>
        <Space y={40} />
        <View
          style={[
            styles.copyAddressContainer,
            { backgroundColor: theme.colorBg2 }
          ]}>
          <TokenAddress
            address={selectedAddress}
            showFullAddress
            textType={'ButtonMedium'}
          />
        </View>
        <Space y={16} />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  copyAddressContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16
  }
})

export default ReceiveToken2
