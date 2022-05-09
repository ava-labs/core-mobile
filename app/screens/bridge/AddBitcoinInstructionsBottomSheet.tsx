import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { InteractionManager, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import TabViewBackground from 'screens/portfolio/components/TabViewBackground'
import AvaxSheetHandle from 'components/AvaxSheetHandle'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import AvaxQACode from 'components/AvaxQRCode'
import { useWalletContext } from '@avalabs/wallet-react-components'
import TokenAddress from 'components/TokenAddress'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useIsMainnet } from 'hooks/isMainnet'

function AddBitcoinInstructionsBottomSheet(): JSX.Element {
  const theme = useApplicationContext().theme
  const navigation = useNavigation()
  const bottomSheetModalRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['0%', '80%'], [])
  const wallet = useWalletContext().wallet
  const isMainnet = useIsMainnet()
  const btcAddress = wallet?.getAddressBTC(isMainnet ? 'bitcoin' : 'testnet')

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetModalRef?.current?.snapTo(1)
    }, 100)
  }, [])

  const handleClose = useCallback(() => {
    bottomSheetModalRef?.current?.close()
    InteractionManager.runAfterInteractions(() => navigation.goBack())
  }, [])

  const handleChange = useCallback(index => {
    index === 0 && handleClose()
  }, [])

  return (
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      backgroundComponent={TabViewBackground}
      onChange={handleChange}>
      <View style={{ marginHorizontal: 16, top: 32 }}>
        <AvaText.LargeTitleBold>Add Bitcoin</AvaText.LargeTitleBold>
        <Space y={16} />
        <AvaText.Body2>
          To bridge you will first need to send your bitcoing to your Core X
          address.
        </AvaText.Body2>
        <Space y={16} />
        <Row style={{ alignItems: 'center' }}>
          <AvaText.Heading2 textStyle={{ paddingEnd: 19 }}>1.</AvaText.Heading2>
          <AvaText.ButtonSmall>
            Copy or scan your Core X bitcoin address below
          </AvaText.ButtonSmall>
        </Row>
        <Space y={14} />
        <Row style={{ alignItems: 'center' }}>
          <AvaText.Heading2 textStyle={{ marginEnd: 16 }}>2.</AvaText.Heading2>
          <AvaText.ButtonSmall>
            Send your existing bitcoin to the copied or scanned address
          </AvaText.ButtonSmall>
        </Row>
        <Space y={14} />
        <Row style={{ alignItems: 'center' }}>
          <AvaText.Heading2 textStyle={{ marginEnd: 16 }}>3.</AvaText.Heading2>
          <AvaText.ButtonSmall>
            When the bitcoin arrives in your Core X address you will be ready to
            bridge
          </AvaText.ButtonSmall>
        </Row>
        <View style={{ alignSelf: 'center', marginVertical: 24 }}>
          <AvaxQACode
            circularText={'C Chain'}
            sizePercentage={0.5}
            address={btcAddress}
            token={'BTC'}
            circularTextColor={'black'}
            circularTextBackgroundColor={'white'}
          />
        </View>
        <AvaText.Heading2>Core X bitcoin Address</AvaText.Heading2>
        <Space y={8} />
        <View
          style={[
            styles.copyAddressContainer,
            { backgroundColor: theme.colorStroke }
          ]}>
          <TokenAddress
            address={btcAddress ?? ''}
            showFullAddress
            textType={'ButtonMedium'}
          />
        </View>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  copyAddressContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  }
})

export default AddBitcoinInstructionsBottomSheet
