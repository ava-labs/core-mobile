import {
  Button,
  Icons,
  showAlert,
  Text,
  TextInput,
  TextInputRef,
  TouchableOpacity,
  View
} from '@avalabs/k2-alpine'
import { copyToClipboard } from 'common/utils/clipboard'
import { useRouter } from 'expo-router'
import { isValidUrl } from 'features/browser/utils'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { ContactAddressMenu } from './ContactAddressMenu'

export interface AdvancedFieldProps {
  id: string
  title: string
  value?: string
  emptyText: string
  disabled?: boolean
  placeholder: string
  optional?: boolean
  type?: 'address' | 'text' | 'url' | 'number'
  onUpdate: (id: string, value?: string) => void
}

export const AdvancedField = ({
  id,
  title,
  value,
  emptyText,
  disabled,
  placeholder,
  type,
  optional,
  onUpdate
}: AdvancedFieldProps): React.JSX.Element => {
  const { navigate } = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(value ?? '')

  const inputRef = useRef<TextInputRef>(null)

  const handleDelete = useCallback(() => {
    showAlert({
      title: 'Do you want to delete this network?',
      description: 'This action can’t be undone',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: () => onUpdate(id, undefined)
        }
      ]
    })
  }, [id, onUpdate])

  const onEdit = useCallback(() => {
    setIsEditing(true)
    inputRef.current?.focus()
  }, [])

  const isValidField = useCallback((): boolean => {
    switch (type) {
      case 'url':
        return isValidUrl(inputValue)
      case 'number':
        return !isNaN(Number(inputValue))
      default:
        return true
    }
  }, [type, inputValue])

  const handleScanQrCode = useCallback(() => {
    navigate({
      pathname: '/accountSettings/addressBook/scanQrCode',
      params: { addressType: title }
    })
  }, [navigate, title])

  const handleCopy = useCallback(() => {
    if (value) {
      copyToClipboard(value, `${title} copied!`)
    }
  }, [value, title])

  const onSubmit = useCallback(() => {
    if (!inputValue?.length) {
      onUpdate(id, undefined)
      setIsEditing(false)
      return
    }
    if (!isValidField()) {
      showAlert({
        title: 'Invalid Url',
        description: 'The url your entered is not valid',
        buttons: [
          {
            text: 'Dismiss',
            style: 'default',
            onPress: () => {
              setIsEditing(false)
              setInputValue('')
            }
          }
        ]
      })
      return
    }
    onUpdate(id, inputValue)
    setIsEditing(false)
  }, [isValidField, onUpdate, id, inputValue])

  const onBlur = useCallback(() => {
    onSubmit()
  }, [onSubmit])

  const keyboardType = useMemo(() => {
    switch (type) {
      case 'address':
        return 'default'
      case 'text':
        return 'ascii-capable'
      case 'url':
        return 'url'
      case 'number':
        return 'numeric'
      default:
        return 'default'
    }
  }, [type])

  const renderContent = (): React.ReactNode => {
    if (inputValue?.length)
      return (
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 14
          }}>
          {disabled ? null : (
            <TouchableOpacity
              onPress={handleDelete}
              style={{
                paddingLeft: 16,
                paddingRight: 14
              }}>
              <Icons.Custom.DoNotDisturbOn width={20} height={20} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onEdit}
            disabled={disabled}
            style={{
              flex: 1,
              paddingLeft: disabled ? 16 : 0
            }}>
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
              {inputValue}
            </Text>
          </TouchableOpacity>

          {type === 'address' && (
            <Button size="small" type="secondary" onPress={handleCopy}>
              Copy
            </Button>
          )}
        </View>
      )

    return (
      <TouchableOpacity
        onPress={onEdit}
        disabled={disabled}
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 16
        }}>
        <Icons.Custom.AddCircle width={20} height={20} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            sx={{
              fontFamily: 'Inter-Medium'
            }}>
            {emptyText}
          </Text>
          {optional && (
            <Text
              variant="body1"
              sx={{ color: '$textSecondary', fontFamily: 'Inter-Medium' }}>
              {` - Optional`}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  if (value === undefined && type === 'address') {
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
        alignItems: 'center',
        minHeight: 48,
        paddingRight: 16
      }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: isEditing ? 1 : 0,
          opacity: isEditing ? 1 : 0
        }}>
        <TextInput
          ref={inputRef}
          numberOfLines={1}
          onBlur={onBlur}
          submitBehavior="blurAndSubmit"
          autoCorrect={false}
          value={inputValue}
          keyboardType={keyboardType}
          onChangeText={setInputValue}
          placeholder={placeholder}
          textInputSx={{ height: undefined }}
          containerSx={{
            paddingHorizontal: 16,
            height: '100%'
          }}
          editable={!disabled}
        />
      </View>

      {renderContent()}
    </View>
  )
}
