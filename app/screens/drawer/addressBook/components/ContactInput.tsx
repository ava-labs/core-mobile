import React, { useEffect, useState } from 'react'
import AvaText from 'components/AvaText'
import InputText from 'components/InputText'
import { Space } from 'components/Space'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { isAddress } from '@ethersproject/address'
import { isBech32Address } from '@avalabs/bridge-sdk'

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

  useEffect(validateInputs, [address, addressBtc])

  function validateInputs() {
    setAddressError(
      address && !isAddress(address) ? 'Not valid EVM address' : ''
    )
    setBtcAddressError(
      addressBtc && !isBech32Address(addressBtc) ? 'Not valid BTC address' : ''
    )
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
      </View>
    </>
  )
}

export default ContactInput
