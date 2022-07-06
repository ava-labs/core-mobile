import React, { RefObject, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Appearance,
  InteractionManager,
  StyleProp,
  TextInput,
  View,
  ViewStyle
} from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity50 } from 'resources/Constants'
import ClearInputSVG from 'components/svg/ClearInputSVG'
import { Space } from 'components/Space'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import { Popable } from 'react-native-popable'
import AvaText from './AvaText'
import AvaButton from './AvaButton'

type Props = {
  onChangeText?: (text: string) => void
  editable?: boolean
  multiline?: boolean
  minHeight?: number
  onSubmit?: () => void
  onMax?: () => void
  onConfirm?: (text: string) => void
  placeholder?: string
  // Shows label above input
  label?: string
  // Shows helper text under input
  helperText?: string | React.ReactNode
  // Shows error message and error color border
  errorText?: string
  // Private - Hides input, shows toggle button to show input, neon color border. Will disable multiline.
  mode?:
    | 'default'
    | 'private'
    | 'amount'
    | 'confirmEntry'
    | 'percentage'
    | 'currency'
  // Set keyboard type (numeric, text)
  keyboardType?: 'numeric'
  // shows popover info if provided
  popOverInfoText?: string | React.ReactElement
  autoFocus?: boolean
  text: string
  currency?: string
  onInputRef?: (inputRef: RefObject<TextInput>) => void
  width?: number
  style?: StyleProp<ViewStyle>
  loading?: boolean
  paddingVertical?: number
}

export default function InputText({
  text,
  helperText,
  errorText,
  onChangeText,
  onInputRef,
  currency,
  style,
  keyboardType,
  editable,
  label,
  popOverInfoText,
  mode,
  onMax,
  width,
  minHeight,
  placeholder,
  loading,
  multiline,
  onSubmit,
  onConfirm,
  autoFocus,
  paddingVertical = 12
}: Props | Readonly<Props>) {
  const context = useApplicationContext()
  const [showInput, setShowInput] = useState(false)
  const [focused, setFocused] = useState(false)
  const [toggleShowText, setToggleShowText] = useState('Show')
  const textInputRef = useRef() as RefObject<TextInput>

  useEffect(() => {
    onInputRef?.(textInputRef)
  }, [textInputRef])

  useEffect(() => {
    setToggleShowText(showInput ? 'Hide' : 'Show')
  }, [showInput])

  useEffect(() => {
    if (autoFocus) {
      InteractionManager.runAfterInteractions(() => {
        textInputRef.current?.focus()
      })
    }
  }, [autoFocus, textInputRef])

  const submit = (): void => {
    onSubmit?.()
  }
  const onClear = (): void => {
    onTextChanged?.('')
  }
  const onToggleShowInput = (): void => {
    setShowInput(!showInput)
  }

  const theme = context.theme

  const ClearBtn = () => {
    return (
      <View
        style={[
          {
            position: 'absolute',
            end: 8,
            top: 2
          }
        ]}>
        <AvaButton.Icon onPress={onClear}>
          <ClearInputSVG color={theme.colorText2} size={14} />
        </AvaButton.Icon>
      </View>
    )
  }

  // @ts-expect-error Percent is not being used temporarily
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const Percent = () => {
    return (
      <View
        style={[
          {
            position: 'absolute',
            justifyContent: 'center',
            end: 16
          }
        ]}>
        <AvaText.Heading3>%</AvaText.Heading3>
      </View>
    )
  }

  const Currency = ({ currency }: { currency?: string }) => {
    return (
      <View
        style={[
          {
            position: 'absolute',
            justifyContent: 'center',
            end: 16
          }
        ]}>
        <AvaText.Heading3>{currency}</AvaText.Heading3>
      </View>
    )
  }

  const ShowPassBtn = () => {
    return (
      <View
        style={[
          {
            position: 'absolute',
            end: 0
          }
        ]}>
        <AvaButton.TextMedium onPress={onToggleShowInput}>
          {toggleShowText}
        </AvaButton.TextMedium>
      </View>
    )
  }

  const Label = () => {
    return (
      <View style={{ alignSelf: 'baseline' }}>
        {popOverInfoText ? (
          <Popable
            content={popOverInfoText}
            position={'right'}
            style={{ minWidth: 200 }}
            backgroundColor={context.theme.colorBg3}>
            <AvaText.Body2>{label ?? ''}</AvaText.Body2>
          </Popable>
        ) : (
          <AvaText.Body2>{label ?? ''}</AvaText.Body2>
        )}
        <View style={[{ height: 8 }]} />
      </View>
    )
  }

  const HelperText = () => {
    return (
      <>
        <Space y={5} />
        {!!helperText && typeof helperText === 'string' ? (
          <AvaText.Body2 textStyle={{ textAlign: 'left' }}>
            {helperText}
          </AvaText.Body2>
        ) : (
          <View>{helperText}</View>
        )}
      </>
    )
  }

  const ErrorText = () => {
    return (
      <>
        <View style={[{ height: 4 }]} />
        <AvaText.Body3
          textStyle={{ textAlign: 'left' }}
          color={theme.colorError}>
          {errorText || ''}
        </AvaText.Body3>
      </>
    )
  }

  const onTextChanged = (text: string): void => {
    if (keyboardType === 'numeric') {
      text = text.replace(',', '.')
      text = text.replace(/[^.\d]/g, '') //remove non-digits
      text = text.replace(/^0+/g, '0') //remove starting double 0
      text = text.replace(/^0(?=\d)/g, '') //remove starting 0 if next one is digit
      let numOfDots = 0
      text = text.replace(/\./g, substring => {
        //remove extra decimal points
        if (numOfDots === 0) {
          numOfDots++
          return substring
        } else {
          return ''
        }
      })
    }
    onChangeText?.(text)
  }

  return (
    <View style={[{ margin: 12 }, style]}>
      {label && <Label />}
      <View
        style={[
          {
            justifyContent: 'center'
          }
        ]}>
        <TextInput
          keyboardAppearance={Appearance.getColorScheme() || 'default'}
          ref={textInputRef}
          autoCapitalize="none"
          placeholder={placeholder}
          placeholderTextColor={theme.colorText2}
          blurOnSubmit={true}
          secureTextEntry={mode === 'private' && !showInput}
          onSubmitEditing={submit}
          returnKeyType={onSubmit && 'go'}
          enablesReturnKeyAutomatically={true}
          editable={editable !== false}
          keyboardType={keyboardType}
          multiline={multiline && mode === 'default' ? multiline : false}
          style={[
            {
              minHeight: minHeight,
              flexGrow: 0,
              color: theme.colorText1,
              fontSize: 16,
              borderWidth: 1,
              textAlignVertical: multiline ? 'top' : undefined,
              borderColor: errorText
                ? theme.colorError
                : focused
                ? theme.colorText2
                : theme.colorBg3,
              backgroundColor:
                text.length > 0
                  ? theme.transparent
                  : focused
                  ? theme.transparent
                  : theme.colorBg3 + Opacity50,
              borderRadius: 8,
              paddingStart: 16,
              paddingEnd:
                mode === 'private'
                  ? 80
                  : mode === 'amount' && !onMax
                  ? 16
                  : mode === 'currency'
                  ? 50
                  : 46,
              paddingVertical: paddingVertical,
              fontFamily: 'Inter-Regular',
              width: width
            }
          ]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChangeText={onTextChanged}
          value={text}
        />
        {mode === 'default' && text.length > 0 && <ClearBtn />}
        {mode === 'private' && text.length > 0 && <ShowPassBtn />}
        {mode === 'amount' && onMax && <MaxBtn onPress={onMax} />}
        {mode === 'confirmEntry' && (
          <ConfirmBtn onPress={() => onConfirm?.(text)} />
        )}
        {mode === 'percentage' && <Percent />}
        {mode === 'currency' && <Currency currency={currency} />}
        {loading && (
          <ActivityIndicator
            style={{ position: 'absolute', right: 16 }}
            size={'small'}
          />
        )}
      </View>

      {helperText && <HelperText />}

      {(errorText || false) && <ErrorText />}
    </View>
  )
}

function MaxBtn({ onPress }: { onPress?: () => void }) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          end: 0
        }
      ]}>
      <AvaButton.TextMedium onPress={onPress}>Max</AvaButton.TextMedium>
    </View>
  )
}

function ConfirmBtn({ onPress }: { onPress?: () => void }) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          end: 16
        }
      ]}>
      <AvaButton.Icon onPress={onPress}>
        <CheckmarkSVG />
      </AvaButton.Icon>
    </View>
  )
}
