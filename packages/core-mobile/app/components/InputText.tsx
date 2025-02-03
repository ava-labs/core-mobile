import React, { forwardRef, useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Appearance,
  Keyboard,
  TextInput,
  NativeSyntheticEvent,
  StyleProp,
  TextInputFocusEventData,
  TextStyle,
  ViewStyle,
  LayoutChangeEvent,
  KeyboardTypeOptions
} from 'react-native'
import ClearInputSVG from 'components/svg/ClearInputSVG'
import { Space } from 'components/Space'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import { Row } from 'components/Row'
import {
  alpha,
  useTheme,
  View,
  Text,
  Button,
  SxProp,
  Pressable,
  Icons
} from '@avalabs/k2-mobile'
import AvaButton from './AvaButton'
import { Tooltip } from './Tooltip'
import InfoSVG from './svg/InfoSVG'

type Mode =
  | 'default'
  | 'private'
  | 'amount'
  | 'confirmEntry'
  | 'percentage'
  | 'currency'
  | 'url'

export type InputTextProps = {
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void
  onChangeText?: (text: string) => void
  editable?: boolean
  multiline?: boolean
  minHeight?: number
  maxLength?: number
  onSubmit?: () => void
  onMax?: () => void
  onRefresh?: () => void
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
  keyboardType?: KeyboardTypeOptions
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
  autoCorrect?: boolean
  inputTextContainerStyle?: SxProp
  onLayout?: (event: LayoutChangeEvent) => void
  clearBtnContainerSx?: SxProp
  borderColor?: string
}

const InputText = forwardRef<TextInput, InputTextProps>(
  (
    {
      text,
      helperText,
      errorText,
      onBlur,
      onFocus,
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
      onRefresh,
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
      keyboardDidHide,
      autoCorrect,
      inputTextContainerStyle,
      onLayout,
      clearBtnContainerSx,
      borderColor = 'transparent',
      testID
    },
    ref
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ) => {
    const [showInput, setShowInput] = useState(false)
    const [toggleShowText, setToggleShowText] = useState('Show')
    const [isFocused, setIsFocused] = useState(false)

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
      (args: NativeSyntheticEvent<TextInputFocusEventData>) => {
        onBlur?.(args)
        setIsFocused(false)
      },
      [onBlur]
    )

    const handleFocus = useCallback(
      (args: NativeSyntheticEvent<TextInputFocusEventData>) => {
        setIsFocused(true)

        onFocus?.(args)
      },
      [onFocus]
    )
    const {
      theme: { colors }
    } = useTheme()

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
            backgroundColor={colors.$neutral100}
          />
        )}
        <View
          sx={{
            justifyContent: 'center',
            ...inputTextContainerStyle
          }}>
          <TextInput
            onLayout={onLayout}
            selectionColor={colors.$neutral50}
            maxLength={maxLength}
            testID={testID}
            keyboardAppearance={Appearance.getColorScheme() || 'default'}
            ref={ref}
            autoCorrect={autoCorrect}
            autoFocus={autoFocus}
            autoCapitalize="none"
            placeholder={placeholder}
            placeholderTextColor={colors.$neutral400}
            secureTextEntry={
              // On Android, setting secureText to false causes the keyboardType to be ignored.
              // To avoid this issue, secureText is set to undefined instead of false.
              mode === 'private' && !showInput ? true : undefined
            }
            onSubmitEditing={submit}
            returnKeyType={onSubmit && 'go'}
            enablesReturnKeyAutomatically={true}
            editable={editable !== false}
            keyboardType={keyboardType}
            selectTextOnFocus={selectTextOnFocus}
            multiline={multiline && mode === 'default'}
            style={[
              {
                textAlign: 'left',
                minHeight: minHeight,
                flexGrow: 0,
                color: colors.$neutral50,
                fontSize: 16,
                borderWidth: 1,
                borderRadius: 8,
                borderColor,
                textAlignVertical: multiline ? 'top' : 'center',
                backgroundColor:
                  backgroundColor || alpha(colors.$neutral800, 0.5),
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
            onChangeText={onTextChanged}
            value={text}
          />
          {((mode === 'default' && text.length > 0) ||
            (mode === 'url' && isFocused && text.length > 0)) && (
            <View
              sx={{
                position: 'absolute',
                right: 8,
                ...clearBtnContainerSx
              }}>
              <ClearBtn color={colors.$neutral400} onClear={onClear} />
            </View>
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
          {mode === 'url' && !isFocused && (
            <View
              sx={{
                position: 'absolute',
                right: 8,
                ...clearBtnContainerSx
              }}>
              <Pressable onPress={onRefresh}>
                <Icons.Navigation.Refresh
                  testID="refresh"
                  color={colors.$neutral50}
                />
              </Pressable>
            </View>
          )}
        </View>

        {helperText && <HelperText helperText={helperText} />}

        {errorText && (
          <ErrorText color={colors.$dangerMain} errorText={errorText} />
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
      sx={{
        position: 'absolute',
        end: 0
      }}>
      <Button
        type="tertiary"
        size="small"
        onPress={onPress}
        testID="input_text__max_button">
        Max
      </Button>
    </View>
  )
}

function ConfirmBtn({ onPress }: { onPress?: () => void }): JSX.Element {
  return (
    <View
      sx={{
        position: 'absolute',
        end: 16
      }}>
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
    <View sx={{ alignSelf: 'baseline' }}>
      {popOverInfoText ? (
        <Tooltip
          content={popOverInfoText}
          position={popOverPosition ?? 'right'}
          style={{ width: 200 }}
          backgroundColor={backgroundColor}
          isLabelPopable>
          <Row style={{ alignItems: 'center' }}>
            <Text variant="body2">{label ?? ''}</Text>
            <Space x={6} />
            <InfoSVG size={14} />
          </Row>
        </Tooltip>
      ) : (
        <Text variant="body2">{label ?? ''}</Text>
      )}
      <View sx={{ height: 8 }} />
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
    <AvaButton.Icon onPress={onClear} testID="input_text__clear_button">
      <ClearInputSVG color={color} size={14} />
    </AvaButton.Icon>
  )
}

const Percent = (): JSX.Element => {
  return (
    <View
      sx={{
        position: 'absolute',
        justifyContent: 'center',
        end: 16
      }}>
      <Text variant="body1">%</Text>
    </View>
  )
}

const Currency = ({ currency }: { currency?: string }): JSX.Element => {
  return (
    <View
      sx={{
        position: 'absolute',
        justifyContent: 'center',
        end: 16
      }}>
      <Text variant="heading3">{currency}</Text>
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
      sx={{
        position: 'absolute',
        end: 0
      }}>
      <Button type="primary" size="xlarge" onPress={onToggleShowInput}>
        {toggleShowText}
      </Button>
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
        <Text
          variant="body2"
          sx={{ textAlign: 'left' }}
          testID="input_text__helper_text">
          {helperText}
        </Text>
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
      <View sx={{ height: 4 }} />
      <Text
        variant="caption"
        sx={{ textAlign: 'left', color }}
        testID="input_text__error_text">
        {errorText || ''}
      </Text>
    </>
  )
}

export default InputText
