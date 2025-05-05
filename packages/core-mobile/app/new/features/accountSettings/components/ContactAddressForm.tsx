import React, { useState, useCallback } from 'react'
import {
  TouchableOpacity,
  useTheme,
  View,
  Text,
  Icons,
  TextInput,
  Button
} from '@avalabs/k2-alpine'
import { Keyboard, Platform } from 'react-native'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { copyToClipboard } from 'common/utils/clipboard'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { AddressType } from '../consts'
import { ContactAddressMenu } from './ContactAddressMenu'

interface ContactAddressFormProps {
  title: AddressType
  address?: string
  emptyText: string
  placeholder: string
  onUpdateAddress: (addressType: AddressType, value?: string) => void
}

export const ContactAddressForm = ({
  title,
  address,
  emptyText,
  placeholder,
  onUpdateAddress
}: ContactAddressFormProps): React.JSX.Element => {
  const params = useLocalSearchParams<{
    address: string
    addressType: AddressType
  }>()
  const { navigate, setParams } = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState('')
  const {
    theme: { colors }
  } = useTheme()

  useFocusEffect(
    useCallback(() => {
      if (params.address && params.addressType === title) {
        onUpdateAddress(params.addressType, params.address)
        setParams({ address: undefined, addressType: undefined })
      }
    }, [params.address, params.addressType, title, onUpdateAddress, setParams])
  )

  const handleScanQrCode = useCallback(() => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/accountSettings/addressBook/scanQrCode',
      params: { addressType: title }
    })
  }, [navigate, title])

  const handleCopyAddress = useCallback(() => {
    if (address) {
      copyToClipboard(address, `${title} address copied!`)
    }
  }, [address, title])

  const renderAddress = useCallback(() => {
    if (isEditing) {
      return (
        <TextInput
          autoFocus
          onSubmitEditing={e => {
            e.nativeEvent.text.length > 0 &&
              onUpdateAddress(title, e.nativeEvent.text)
            setIsEditing(false)
            setValue('')
            Keyboard.dismiss()
          }}
          onBlur={() => {
            setIsEditing(false)
          }}
          submitBehavior="blurAndSubmit"
          autoCorrect={false}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          textInputSx={{ height: Platform.OS === 'ios' ? undefined : 40 }}
          containerSx={{ paddingHorizontal: undefined }}
        />
      )
    }

    if (address === undefined) {
      return (
        <ContactAddressMenu
          onTypeOrPaste={() => setIsEditing(true)}
          onScanQrCode={handleScanQrCode}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Icons.Custom.AddCircle width={20} height={20} />
            <Text variant="body1">{emptyText}</Text>
          </View>
        </ContactAddressMenu>
      )
    }

    return (
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <TouchableOpacity
          onPress={() => onUpdateAddress(title, undefined)}
          style={{
            backgroundColor: colors.$surfaceSecondary,
            gap: 14,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
          <Icons.Custom.DoNotDisturbOn width={20} height={20} />
          <View>
            <Text
              variant="buttonMedium"
              sx={{
                fontFamily: 'Inter-Medium',
                fontSize: 16,
                color: '$textPrimary'
              }}>
              {title}
            </Text>
            <Text
              variant="mono"
              sx={{
                color: '$textSecondary',
                fontSize: 13,
                lineHeight: 18
              }}>
              {truncateAddress(address, TRUNCATE_ADDRESS_LENGTH)}
            </Text>
          </View>
        </TouchableOpacity>
        <Button size="small" type="secondary" onPress={handleCopyAddress}>
          Copy
        </Button>
      </View>
    )
  }, [
    address,
    colors.$surfaceSecondary,
    emptyText,
    handleCopyAddress,
    handleScanQrCode,
    isEditing,
    onUpdateAddress,
    placeholder,
    title,
    value
  ])

  return renderAddress()
}
