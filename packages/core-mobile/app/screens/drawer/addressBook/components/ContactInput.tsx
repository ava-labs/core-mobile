import React, { useEffect, useState } from 'react'
import AvaText from 'components/AvaText'
import InputText from 'components/InputText'
import { Space } from 'components/Space'
import { Modal, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { isAddress } from 'ethers'
import { isBech32Address } from '@avalabs/bridge-sdk'
import AvaButton from 'components/AvaButton'
import QRScanSVG from 'components/svg/QRScanSVG'
import QrScannerAva from 'components/QrScannerAva'
import Logger from 'utils/Logger'

const ContactInput = ({
  name,
  address,
  addressBtc,
  addressXP,
  onNameChange,
  onAddressChange,
  onAddressBtcChange,
  onAddressXPChange
}: {
  name: string
  address: string
  addressBtc: string
  addressXP: string
  onNameChange: (name: string) => void
  onAddressChange: (address: string) => void
  onAddressBtcChange: (address: string) => void
  onAddressXPChange: (address: string) => void
}): JSX.Element => {
  const { theme } = useApplicationContext()
  const [addressError, setAddressError] = useState('')
  const [btcAddressError, setBtcAddressError] = useState('')
  const [qrScanChain, setQrScanChain] = useState<
    'C' | 'XP' | 'BTC' | undefined
  >(undefined)

  useEffect(validateInputs, [address, addressBtc])

  function validateInputs(): void {
    setAddressError(
      address && !isAddress(address) ? 'Not valid EVM address' : ''
    )
    setBtcAddressError(
      addressBtc && !isBech32Address(addressBtc) ? 'Not valid BTC address' : ''
    )
  }

  function onCChainScanQR(): void {
    setQrScanChain('C')
  }

  function onPChainScanQR(): void {
    setQrScanChain('XP')
  }

  function onBtcScanQR(): void {
    setQrScanChain('BTC')
  }

  function clearQRSCan(): void {
    setQrScanChain(undefined)
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
      <Space y={24} />
      <AvaText.Body2 textStyle={{ color: theme.colorText1 }}>
        Avalanche P-Chain Address
      </AvaText.Body2>
      <View style={{ marginHorizontal: -16 }}>
        <InputText
          multiline
          errorText={btcAddressError}
          placeholder={'Enter the P- address'}
          text={addressXP}
          onChangeText={onAddressXPChange}
        />
        {!addressXP && (
          <View style={styles.qrScan}>
            <AvaButton.Icon onPress={onPChainScanQR}>
              <QRScanSVG />
            </AvaButton.Icon>
          </View>
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        onRequestClose={clearQRSCan}
        visible={!!qrScanChain}>
        <QrScannerAva
          onSuccess={data => {
            switch (qrScanChain) {
              case 'C':
                onAddressChange(data)
                break
              case 'XP':
                onAddressXPChange(data)
                break
              case 'BTC':
                onAddressBtcChange(data)
                break
              default:
                Logger.error('not handled: ' + qrScanChain)
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
