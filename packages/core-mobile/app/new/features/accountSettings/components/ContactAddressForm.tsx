import React, { useState, useCallback } from 'react'
import {
  TouchableOpacity,
  useTheme,
  View,
  Text,
  Icons,
  TextInput
} from '@avalabs/k2-alpine'
import { Keyboard } from 'react-native'
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { AddressType } from './ContactForm'

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
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState('')
  const {
    theme: { colors }
  } = useTheme()

  const renderAddress = useCallback(() => {
    if (isEditing) {
      return (
        <TextInput
          autoFocus
          numberOfLines={1}
          onSubmitEditing={e => {
            e.nativeEvent.text.length > 0 &&
              onUpdateAddress(title, e.nativeEvent.text)
            setIsEditing(false)
            setValue('')
            Keyboard.dismiss()
          }}
          onBlur={() => {
            setValue('')
            setIsEditing(false)
          }}
          submitBehavior="blurAndSubmit"
          autoCorrect={false}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          textInputSx={{ height: undefined }}
          containerSx={{ paddingHorizontal: undefined }}
        />
      )
    }

    if (address === undefined) {
      return (
        <TouchableOpacity
          sx={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
          onPress={() => {
            setIsEditing(true)
          }}>
          <Icons.Custom.AddCircle width={20} height={20} />
          <Text variant="body1">{emptyText}</Text>
        </TouchableOpacity>
      )
    }

    return (
      <TouchableOpacity
        onPress={() => onUpdateAddress(title, undefined)}
        style={{
          width: '100%',
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
            {truncateAddress(address)}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }, [
    address,
    colors.$surfaceSecondary,
    emptyText,
    isEditing,
    onUpdateAddress,
    placeholder,
    title,
    value
  ])

  return renderAddress()
}
