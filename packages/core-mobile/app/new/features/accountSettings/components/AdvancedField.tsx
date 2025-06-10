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
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { AddressType } from '../consts'
import { isValidAddress } from '../utils/isValidAddress'
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

export type AdvancedFieldRef = {
  setInputValue: (value: string) => void
}

export const AdvancedField = forwardRef<AdvancedFieldRef, AdvancedFieldProps>(
  (
    {
      id,
      title,
      value,
      emptyText,
      disabled,
      placeholder,
      type,
      optional,
      onUpdate
    }: AdvancedFieldProps,
    ref
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ): React.JSX.Element => {
    const { navigate } = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [inputValue, setInputValue] = useState(value ?? '')

    const inputRef = useRef<TextInputRef>(null)

    useImperativeHandle(ref, () => ({
      setInputValue: (newValue: string) => {
        setInputValue(newValue)
      }
    }))

    const handleDelete = useCallback(() => {
      showAlert({
        title: 'Do you want to delete this network?',
        description: 'This action can’t be undone',
        buttons: [
          {
            text: 'Cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              onUpdate(id, undefined)
              setInputValue('')
            }
          }
        ]
      })
    }, [id, onUpdate])

    const onEdit = useCallback(() => {
      setIsEditing(true)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }, [])

    const onReset = useCallback(() => {
      setIsEditing(false)
      setInputValue(value ?? '')
    }, [value])

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
        // @ts-ignore TODO: make routes typesafe
        pathname: '/accountSettings/addressBook/scanQrCode',
        params: { addressType: title }
      })
    }, [navigate, title])

    const handleCopy = useCallback(() => {
      if (value) {
        copyToClipboard(value, `${title} copied!`)
      }
    }, [value, title])

    const isDeveloperMode = useSelector(selectIsDeveloperMode)

    const onSubmit = useCallback(() => {
      if (!inputValue?.length) {
        onUpdate(id, undefined)
        setIsEditing(false)
        return
      }
      if (
        type === 'address' &&
        !isValidAddress({
          addressType: title as AddressType,
          address: inputValue,
          isDeveloperMode
        })
      ) {
        showAlert({
          title: 'Invalid address',
          description:
            'The address you entered is not valid for the selected chain',
          buttons: [
            {
              text: 'Got it',
              style: 'default',
              onPress: onReset
            }
          ]
        })
        return
      }

      if (!isValidField()) {
        showAlert({
          title: `Invalid field`,
          description: `The ${type} your entered is not valid`,
          buttons: [
            {
              text: 'Dismiss',
              style: 'default',
              onPress: onReset
            }
          ]
        })
        return
      }
      onUpdate(id, inputValue)
      setIsEditing(false)
    }, [
      inputValue,
      type,
      title,
      isDeveloperMode,
      isValidField,
      onUpdate,
      id,
      onReset
    ])

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

    const onClear = useCallback(() => {
      setInputValue('')
      onEdit()
    }, [onEdit])

    const renderEmpty = (): React.ReactNode => {
      return (
        <>
          <Icons.Custom.AddCircle width={20} height={20} />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text
              sx={{
                fontFamily: 'Inter-Medium'
              }}
              numberOfLines={1}
              ellipsizeMode="tail">
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
        </>
      )
    }

    const renderPlaceholder = (): React.ReactNode => {
      return (
        <>
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
        </>
      )
    }

    const renderContent = (): React.ReactNode => {
      if (isEditing) return null
      if (inputValue?.length)
        return (
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
            {disabled ? null : (
              <TouchableOpacity
                onPress={type === 'address' ? handleDelete : onClear}
                hitSlop={14}
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
                paddingLeft: disabled ? 16 : 0,
                paddingVertical: 14
              }}>
              {renderPlaceholder()}
            </TouchableOpacity>
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
            paddingHorizontal: 16,
            height: '100%',
            flex: 1
          }}>
          {renderEmpty()}
        </TouchableOpacity>
      )
    }

    const renderAddressContent = (): React.ReactNode => {
      if (isEditing) return null
      if (inputValue?.length)
        return (
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
            {disabled ? null : (
              <TouchableOpacity
                onPress={type === 'address' ? handleDelete : onClear}
                hitSlop={14}
                style={{
                  paddingLeft: 16,
                  paddingRight: 14
                }}>
                <Icons.Custom.DoNotDisturbOn width={20} height={20} />
              </TouchableOpacity>
            )}

            <ContactAddressMenu
              onTypeOrPaste={onEdit}
              onScanQrCode={handleScanQrCode}
              style={{
                flex: 1,
                paddingLeft: disabled ? 16 : 0,
                paddingVertical: 14
              }}>
              {renderPlaceholder()}
            </ContactAddressMenu>

            <View style={{ paddingRight: 14, paddingLeft: 14 }}>
              <Button
                size="small"
                hitSlop={14}
                type="secondary"
                onPress={handleCopy}>
                Copy
              </Button>
            </View>
          </View>
        )

      return (
        <ContactAddressMenu
          onTypeOrPaste={onEdit}
          onScanQrCode={handleScanQrCode}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            paddingHorizontal: 16,
            height: '100%',
            flex: 1
          }}>
          {renderEmpty()}
        </ContactAddressMenu>
      )
    }

    return (
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 48
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
              maxHeight: 48,
              height: '100%'
            }}
            editable={!disabled}
          />
        </View>

        {type === 'address' ? renderAddressContent() : renderContent()}
      </View>
    )
  }
)
