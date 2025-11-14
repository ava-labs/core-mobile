import { bigintToBig, bigToBigInt } from '@avalabs/core-utils-sdk'
import Big from 'big.js'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import {
  NativeSyntheticEvent,
  Platform,
  TextInput,
  TextInputFocusEventData,
  TextInputProps
} from 'react-native'
import { useTheme } from '../../hooks'
import {
  normalizeNumericTextInput,
  splitIntegerAndFraction
} from '../../utils/tokenUnitInput'
import { AutoSizeTextInput } from '../AutoSizeTextInput/AutoSizeTextInput'
import { useCursorSelection } from './useCursorSelection'
export interface TokenAmountInputRef {
  focus: () => void
  blur: () => void
}

/**
 * TokenAmountInput takes user's input via InputText component and calls "onChange" callback with { value: bigint; valueString: string } object.
 * If there's no input, callback value is set to { value: new BigInt(0), valueString: '0' }.
 * Because of that, if "value" passed to TokenAmountInput is zero it is sanitized to "undefined" so that user can delete all zeroes from input.
 */
export const TokenAmountInput = forwardRef<
  TokenAmountInputRef,
  TokenAmountInputProps
>(
  (
    {
      value,
      denomination,
      onChange,
      isLoading,
      hideErrorMessage,
      autoFocus,
      onBlur,
      onFocus,
      testID,
      valid = true,
      ...props
    },
    ref
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ) => {
    const { theme } = useTheme()
    const [valueAsString, setValueAsString] = useState('')
    const valueBig = value ? bigintToBig(value, denomination) : undefined
    const inputRef = useRef<TextInput>(null)

    const {
      selection,
      handleSelectionChange,
      moveCursorToFront,
      moveCursorToEnd
    } = useCursorSelection()

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur()
    }))

    useEffect(() => {
      // When deleting zeros after decimal, all zeros delete without this check.
      // This also preserves zeros in the input ui.
      if (
        valueBig &&
        (!valueAsString || !new Big(valueAsString).eq(valueBig))
      ) {
        setValueAsString(valueBig.toString())
      } else if (value === undefined) {
        setValueAsString('')
      }
    }, [valueBig, valueAsString, value])

    const handleChangeText = (rawValue: string): void => {
      const valueText = normalizeNumericTextInput(rawValue)
      if (!valueText) {
        onChange?.({ value: 0n, valueString: '0' })
        setValueAsString('')
        return
      }
      const changedValue = valueText.startsWith('.') ? '0.' : valueText

      /**
       * Split the input and make sure the right side never exceeds
       * the denomination length
       */
      const [, endValue] = splitIntegerAndFraction(changedValue)
      if (!endValue || endValue.length <= denomination) {
        const valueToBigInt = bigToBigInt(new Big(changedValue), denomination)

        setValueAsString(changedValue)
        onChange?.({
          valueString: changedValue ? new Big(changedValue).toString() : '0', // used to removing leading & trailing zeros
          value: valueToBigInt
        })
      }
    }

    useEffect(() => {
      if (autoFocus) {
        requestAnimationFrame(() => {
          inputRef.current?.focus()
        })
      }
    }, [autoFocus])

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current?.setNativeProps({ text: valueAsString })
      }
    }, [valueAsString])

    useEffect(() => {
      if (autoFocus) {
        requestAnimationFrame(() => {
          inputRef.current?.focus()
        })
      }
    }, [autoFocus])

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current?.setNativeProps({ text: valueAsString })
      }
    }, [valueAsString])

    const handleBlur = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>): void => {
        onBlur?.(e)
        moveCursorToFront()
      },
      [moveCursorToFront, onBlur]
    )

    const handleFocus = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>): void => {
        onFocus?.(e)
        moveCursorToEnd()
      },
      [moveCursorToEnd, onFocus]
    )

    return (
      <AutoSizeTextInput
        {...props}
        value={valueAsString}
        ref={inputRef}
        testID={testID}
        keyboardType={Platform.OS === 'ios' ? 'numeric' : undefined}
        inputMode={Platform.OS === 'android' ? 'numeric' : undefined}
        onChangeText={handleChangeText}
        selectionColor={theme.colors.$textPrimary}
        style={props.style}
        onBlur={handleBlur}
        onFocus={handleFocus}
        selection={selection}
        onSelectionChange={handleSelectionChange}
        valid={valid}
      />
    )
  }
)
interface TokenAmountInputProps
  extends Omit<TextInputProps, 'onChange' | 'value'> {
  value?: bigint
  valid?: boolean
  denomination: number

  onChange?(val: TokenAmount): void

  isLoading?: boolean
  hideErrorMessage?: boolean

  testID?: string
}

export type TokenAmount = { value: bigint; valueString: string }
