import {
  Button,
  Icons,
  Text,
  TextInput,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { copyToClipboard } from 'common/utils/clipboard'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { Keyboard } from 'react-native'
import { ContactAddressMenu } from './ContactAddressMenu'

export interface AdvancedFieldProps {
  id: string
  title: string
  value?: string
  emptyText: string
  placeholder: string
  onUpdate: (id: string, value?: string) => void
}

export const AdvancedField = ({
  id,
  title,
  value,
  emptyText,
  placeholder,
  onUpdate
}: AdvancedFieldProps): React.JSX.Element => {
  const { navigate } = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const {
    theme: { colors }
  } = useTheme()

  const handleScanQrCode = useCallback(() => {
    navigate({
      pathname: '/accountSettings/addressBook/scanQrCode',
      params: { addressType: title }
    })
  }, [navigate, title])

  const handleCopy = useCallback(() => {
    if (value) {
      copyToClipboard(value, `${title} address copied!`)
    }
  }, [value, title])

  const renderField = useCallback(() => {
    if (isEditing) {
      return (
        <TextInput
          autoFocus
          numberOfLines={1}
          onSubmitEditing={e => {
            e.nativeEvent.text.length > 0 && onUpdate(id, e.nativeEvent.text)
            setIsEditing(false)
            setInputValue('')
            Keyboard.dismiss()
          }}
          onBlur={() => {
            setIsEditing(false)
          }}
          submitBehavior="blurAndSubmit"
          autoCorrect={false}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          textInputSx={{ height: undefined }}
          containerSx={{
            paddingHorizontal: 16,
            paddingVertical: 14
          }}
        />
      )
    }

    if (value === undefined) {
      return (
        <ContactAddressMenu
          onTypeOrPaste={() => setIsEditing(true)}
          onScanQrCode={handleScanQrCode}>
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingHorizontal: 16,
              paddingVertical: 14
            }}>
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
          onPress={() => onUpdate(undefined)}
          style={{
            backgroundColor: colors.$surfaceSecondary,
            gap: 14,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14
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
              {value}
            </Text>
          </View>
        </TouchableOpacity>
        <Button size="small" type="secondary" onPress={handleCopy}>
          Copy
        </Button>
      </View>
    )
  }, [
    isEditing,
    value,
    colors.$surfaceSecondary,
    title,
    handleCopy,
    inputValue,
    placeholder,
    onUpdate,
    handleScanQrCode,
    emptyText
  ])

  return renderField()
}
