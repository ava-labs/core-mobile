import React, { useEffect, useState } from 'react'
import AvaText from 'components/AvaText'
import InputText from 'components/InputText'
import { Space } from 'components/Space'
import { Modal, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { isAddress } from '@ethersproject/address'
import { isBech32Address } from '@avalabs/bridge-sdk'
import AvaButton from 'components/AvaButton'
import QRScanSVG from 'components/svg/QRScanSVG'
import QrScannerAva from 'components/QrScannerAva'

const ContactInput = ({
  name,
  address,
  addressBtc,
  onNameChange,
  onAddressChange,
  onAddressBtcChange
}: {
  name: string
  address: string
  addressBtc: string
  onNameChange: (name: string) => void
  onAddressChange: (address: string) => void
  onAddressBtcChange: (address: string) => void
}) => {
  const { theme } = useApplicationContext()
  const [addressError, setAddressError] = useState('')
  const [btcAddressError, setBtcAddressError] = useState('')
  const [showCChainQRScan, setShowCChainQRScan] = useState(false)
  const [showBtcQRScan, setShowBtcQRScan] = useState(false)

  useEffect(validateInputs, [address, addressBtc])

  function validateInputs() {
    setAddressError(
      address && !isAddress(address) ? 'Not valid EVM address' : ''
    )
    setBtcAddressError(
      addressBtc && !isBech32Address(addressBtc) ? 'Not valid BTC address' : ''
    )
  }

  function onCChainScanQR() {
    setShowCChainQRScan(true)
  }

  function onBtcScanQR() {
    setShowBtcQRScan(true)
  }

  function clearQRSCan() {
    setShowBtcQRScan(false)
    setShowCChainQRScan(false)
  }

  return (
    <>
      <AvaText.Body2 textStyle={{ color: theme.colorText1 }}>
        Name
      </AvaText.Body2>
      <View style={{ marginHorizontal: -16 }}>
        <InputText
          placeholder={'Enter contact name'}
          text={name}
          onChangeText={onNameChange}
        />
      </View>
      <Space y={24} />
      <AvaText.Body2 textStyle={{ color: theme.colorText1 }}>
        Avalanche C-Chain Address
      </AvaText.Body2>
      <View style={{ marginHorizontal: -16 }}>
        <InputText
          multiline
          errorText={addressError}
          placeholder={'Enter the address'}
          text={address}
          onChangeText={onAddressChange}
        />
        {!address && (
          <View style={styles.qrScan}>
            <AvaButton.Icon onPress={onCChainScanQR}>
              <QRScanSVG />
            </AvaButton.Icon>
          </View>
        )}
      </View>
      <Space y={24} />
      <AvaText.Body2 textStyle={{ color: theme.colorText1 }}>
        Bitcoin Address
      </AvaText.Body2>
      <View style={{ marginHorizontal: -16 }}>
        <InputText
          multiline
          errorText={btcAddressError}
          placeholder={'Enter the Bitcoin address'}
          text={addressBtc}
          onChangeText={onAddressBtcChange}
        />
        {!addressBtc && (
          <View style={styles.qrScan}>
            <AvaButton.Icon onPress={onBtcScanQR}>
              <QRScanSVG />
            </AvaButton.Icon>
          </View>
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        onRequestClose={clearQRSCan}
        visible={showBtcQRScan || showCChainQRScan}>
        <QrScannerAva
          onSuccess={data => {
            if (showCChainQRScan) {
              onAddressChange(data)
            } else if (showBtcQRScan) {
              onAddressBtcChange(data)
            }
            clearQRSCan()
          }}
          onCancel={clearQRSCan}
        />
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  qrScan: {
    position: 'absolute',
    right: 16,
    justifyContent: 'center',
    height: '100%'
  }
})

export default ContactInput
