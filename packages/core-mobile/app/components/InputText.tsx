import React, { forwardRef, useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Appearance,
  Keyboard,
  NativeSyntheticEvent,
  StyleProp,
  TextInput,
  TextInputFocusEventData,
  TextStyle,
  View,
  ViewStyle
} from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity50 } from 'resources/Constants'
import ClearInputSVG from 'components/svg/ClearInputSVG'
import { Space } from 'components/Space'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import { Popable } from 'react-native-popable'
import InfoSVG from 'components/svg/InfoSVG'
import { Row } from 'components/Row'
import AvaText from './AvaText'
import AvaButton from './AvaButton'

type Mode =
  | 'default'
  | 'private'
  | 'amount'
  | 'confirmEntry'
  | 'percentage'
  | 'currency'

export type InputTextProps = {
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void
  onChangeText?: (text: string) => void
  editable?: boolean
  multiline?: boolean
  minHeight?: number
  maxLength?: number
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
  mode?: Mode
  // Set keyboard type (numeric, text)
  keyboardType?: 'numeric'
  // shows popover info if provided
  popOverInfoText?: string | React.ReactElement
  popOverPosition?: 'left' | 'right' | 'top' | 'bottom'
  autoFocus?: boolean
  selectTextOnFocus?: boolean | undefined
  text: string
  currency?: string
  width?: number
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  backgroundColor?: string
  loading?: boolean
  paddingVertical?: number
  keyboardWillShow?: () => void
  keyboardDidHide?: () => void
  testID?: string
}

const InputText = forwardRef<TextInput, InputTextProps>(
  (
    {
      text,
      helperText,
      errorText,
      onBlur,
      onChangeText,
      currency,
      style,
      textStyle,
      backgroundColor,
      keyboardType,
      editable,
      label,
      popOverInfoText,
      popOverPosition,
      mode = 'default',
      onMax,
      width,
      minHeight,
      maxLength,
      placeholder,
      loading,
      multiline,
      onSubmit,
      onConfirm,
      autoFocus,
      selectTextOnFocus,
      paddingVertical = 12,
      keyboardWillShow,
      keyboardDidHide
    },
    ref
  ) => {
    const context = useApplicationContext()
    const [showInput, setShowInput] = useState(false)
    const [toggleShowText, setToggleShowText] = useState('Show')

    const [selection, setSelection] = useState<{ start: number } | undefined>({
      start: 0
    })

    useEffect(() => {
      const sub1 = Keyboard.addListener('keyboardWillShow', _ => {
        keyboardWillShow?.()
      })
      const sub2 = Keyboard.addListener('keyboardDidHide', _ => {
        keyboardDidHide?.()
      })
      return () => {
        sub1.remove()
        sub2.remove()
      }
    }, [keyboardDidHide, keyboardWillShow])

    useEffect(() => {
      setToggleShowText(showInput ? 'Hide' : 'Show')
    }, [showInput])

    const submit = (): void => {
      onSubmit?.()
    }
    const onClear = (): void => {
      onTextChanged && onTextChanged('')
    }
    const onToggleShowInput = (): void => {
      setShowInput(!showInput)
    }

    const handleBlur = useCallback(
      args => {
        setSelection({ start: 0 })
        onBlur?.(args)
      },
      [onBlur]
    )

    const handleFocus = (): void => {
      // set cursor at end of text
      setSelection({ start: text.length })

      // disable selection so that user can position cursor on its own
      setTimeout(() => setSelection(undefined), 100)
    }

    const theme = context.theme

    const onTextChanged = (txt: string): void => {
      if (keyboardType === 'numeric') {
        txt = txt.replace(',', '.')
        txt = txt.replace(/[^.\d]/g, '') //remove non-digits
        txt = txt.replace(/^0+/g, '0') //remove starting double 0
        txt = txt.replace(/^0(?=\d)/g, '') //remove starting 0 if next one is digit
        let numOfDots = 0
        txt = txt.replace(/\./g, substring => {
          //remove extra decimal points
          if (numOfDots === 0) {
            numOfDots++
            return substring
          }
          return ''
        })
      }
      onChangeText?.(txt)
    }

    return (
      <View style={[{ margin: 12 }, style]}>
        {label && (
          <Label
            popOverInfoText={popOverInfoText}
            popOverPosition={popOverPosition}
            label={label}
            backgroundColor={context.theme.neutral100}
          />
        )}
        <View
          style={{
            justifyContent: 'center'
          }}>
          <TextInput
            maxLength={maxLength}
            testID="input_text"
            keyboardAppearance={Appearance.getColorScheme() || 'default'}
            ref={ref}
            autoFocus={autoFocus}
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
            selectTextOnFocus={selectTextOnFocus}
            multiline={multiline && mode === 'default'}
            style={[
              {
                minHeight: minHeight,
                flexGrow: 0,
                color: theme.colorText1,
                fontSize: 16,
                borderWidth: 1,
                borderRadius: 8,
                textAlignVertical: multiline ? 'top' : 'center',
                backgroundColor: backgroundColor || theme.colorBg3 + Opacity50,
                paddingStart: 16,
                paddingEnd: paddingEnd(loading, mode, onMax),
                paddingTop: paddingVertical,
                paddingBottom: paddingVertical,
                fontFamily: 'Inter-Regular',
                width
              },
              textStyle
            ]}
            onBlur={handleBlur}
            onFocus={handleFocus}
            selection={selection}
            onChangeText={onTextChanged}
            value={text}
          />
          {mode === 'default' && text.length > 0 && (
            <ClearBtn color={theme.colorText2} onClear={onClear} />
          )}
          {mode === 'private' && text.length > 0 && (
            <ShowPassBtn
              onToggleShowInput={onToggleShowInput}
              toggleShowText={toggleShowText}
            />
          )}
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

        {helperText && <HelperText helperText={helperText} />}

        {errorText && (
          <ErrorText color={theme.colorError} errorText={errorText} />
        )}
      </View>
    )
  }
)

const paddingEnd = (
  loading?: boolean,
  mode?: Mode,
  onMax?: () => void
): number => {
  if (loading) {
    return 46
  }
  if (mode === 'private') {
    return 80
  }
  if (mode === 'amount' && !onMax) {
    return 16
  }
  if (mode === 'currency') {
    return 50
  }
  return 46
}

function MaxBtn({ onPress }: { onPress?: () => void }): JSX.Element {
  return (
    <View
      style={[
        {
          position: 'absolute',
          end: 0
        }
      ]}>
      <AvaButton.TextMedium onPress={onPress} testID="input_text__max_button">
        Max
      </AvaButton.TextMedium>
    </View>
  )
}

function ConfirmBtn({ onPress }: { onPress?: () => void }): JSX.Element {
  return (
    <View
      style={[
        {
          position: 'absolute',
          end: 16
        }
      ]}>
      <AvaButton.Icon onPress={onPress} testID="input_text__confirm_button">
        <CheckmarkSVG />
      </AvaButton.Icon>
    </View>
  )
}

const Label = ({
  popOverInfoText,
  popOverPosition,
  label,
  backgroundColor
}: {
  popOverInfoText?: string | React.ReactElement
  popOverPosition?: 'left' | 'right' | 'top' | 'bottom'
  label?: string
  backgroundColor: string
}): JSX.Element => {
  return (
    <View style={{ alignSelf: 'baseline' }}>
      {popOverInfoText ? (
        <Popable
          content={popOverInfoText}
          position={popOverPosition ?? 'right'}
          style={{ minWidth: 200 }}
          backgroundColor={backgroundColor}>
          <Row style={{ alignItems: 'center' }}>
            <AvaText.Body2>{label ?? ''}</AvaText.Body2>
            <Space x={6} />
            <InfoSVG size={14} />
          </Row>
        </Popable>
      ) : (
        <AvaText.Body2>{label ?? ''}</AvaText.Body2>
      )}
      <View style={{ height: 8 }} />
    </View>
  )
}

const ClearBtn = ({
  onClear,
  color
}: {
  onClear: () => void
  color: string
}): JSX.Element => {
  return (
    <View
      style={[
        {
          position: 'absolute',
          right: 8
        }
      ]}>
      <AvaButton.Icon onPress={onClear} testID="input_text__clear_button">
        <ClearInputSVG color={color} size={14} />
      </AvaButton.Icon>
    </View>
  )
}

const Percent = (): JSX.Element => {
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

const Currency = ({ currency }: { currency?: string }): JSX.Element => {
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

const ShowPassBtn = ({
  onToggleShowInput,
  toggleShowText
}: {
  onToggleShowInput: () => void
  toggleShowText: string
}): JSX.Element => {
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

const HelperText = ({
  helperText
}: {
  helperText?: string | React.ReactNode
}): JSX.Element => {
  return (
    <>
      <Space y={5} />
      {!!helperText && typeof helperText === 'string' ? (
        <AvaText.Body2
          textStyle={{ textAlign: 'left' }}
          testID="input_text__helper_text">
          {helperText}
        </AvaText.Body2>
      ) : (
        <View>{helperText}</View>
      )}
    </>
  )
}

const ErrorText = ({
  errorText,
  color
}: {
  errorText: string | undefined
  color: string
}): JSX.Element => {
  return (
    <>
      <View style={{ height: 4 }} />
      <AvaText.Body3
        textStyle={{ textAlign: 'left' }}
        color={color}
        testID="input_text__error_text">
        {errorText || ''}
      </AvaText.Body3>
    </>
  )
}

export default InputText
