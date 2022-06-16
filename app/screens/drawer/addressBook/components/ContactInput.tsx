import React, { useEffect } from 'react'
import AvaText from 'components/AvaText'
import InputText from 'components/InputText'
import { Space } from 'components/Space'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

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

  useEffect(() => {
    onNameChange(name)
  }, [name, onNameChange])

  useEffect(() => {
    onAddressChange(address)
  }, [address, onAddressChange])

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
          placeholder={'Enter the Bitcoin address'}
          text={addressBtc}
          onChangeText={onAddressBtcChange}
        />
      </View>
    </>
  )
}

export default ContactInput
