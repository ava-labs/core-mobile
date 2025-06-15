import debounce from 'lodash.debounce'
import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import { TextInput, TextInputProps, ViewStyle } from 'react-native'
import { useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'
import { Text, TouchableOpacity, View } from '../Primitives'

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  onTextChanged: (value: string) => void
  searchText: string
  placeholder?: string
  useDebounce?: boolean
  debounceMillis?: number
  textColor?: string
  testID?: string
  setSearchBarFocused?: (value: boolean) => void
  containerStyle?: ViewStyle
  rightComponent?: JSX.Element
  useCancel?: boolean
}

const DEFAULT_DEBOUNCE_MILLISECONDS = 150
const HEIGHT = 40

/**
 * SearchBar component. Text state is handled outside the
 * component except for when the text is cleared.
 *
 * Shows custom right component when search bar has no search text and a right component is provided.
 * Shows Clear button when search bar has search text.
 *
 * @param onTextChanged callback to implementing view
 * @param searchText current search text
 * @param placeholder defaults to 'Search'
 * @param debounce if true, will delay calling 'onTextChanged' by default ms
 * @param textColor
 * @param rightComponent custom right component to show when search text is empty
 * @param rest all other props
 * @constructor
 */

export const SearchBar: FC<Props> = ({
  onTextChanged,
  searchText,
  placeholder = 'Search',
  useDebounce = false,
  debounceMillis = DEFAULT_DEBOUNCE_MILLISECONDS,
  textColor,
  setSearchBarFocused,
  containerStyle,
  rightComponent,
  useCancel,
  ...rest
}) => {
  const textInputRef = useRef<TextInput>(null)
  const {
    theme: { colors }
  } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const [_searchText, _setSearchText] = useState(searchText)

  useEffect(() => {
    setSearchBarFocused?.(isFocused)
  }, [isFocused, setSearchBarFocused])

  useEffect(() => {
    _setSearchText(searchText)
  }, [searchText])

  /**
   * Clears the input by reference and state,
   */
  function clearText(): void {
    textInputRef?.current?.clear()
    onTextChanged('')
  }

  /**
   * Sets the behavior for when the user cancels
   * the search
   */
  function onCancel(): void {
    setIsFocused(false)
    clearText()
    textInputRef.current?.blur()
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceFn = useCallback(debounce(onTextChanged, debounceMillis), [])

  const handleTextChange = (value: string): void => {
    _setSearchText(value)
    if (useDebounce) {
      debounceFn(value)
    } else {
      onTextChanged(value)
    }
  }

  const renderRightComponent = (): React.JSX.Element | undefined => {
    if (searchText.length > 0) {
      return (
        <TouchableOpacity
          onPress={clearText}
          sx={{
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 12,
            height: '100%'
          }}>
          <Icons.Action.Clear color={colors.$textSecondary} />
        </TouchableOpacity>
      )
    }
    if (
      (searchText === undefined || searchText.length === 0) &&
      rightComponent
    ) {
      return rightComponent
    }
  }

  return (
    <View style={[{ flexDirection: 'row' }, containerStyle]}>
      <View
        style={{
          height: HEIGHT,
          borderRadius: 1000,
          flex: 1,
          backgroundColor: colors.$surfaceSecondary,
          flexDirection: 'row'
        }}>
        <View
          sx={{
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
            flex: 1
          }}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 12,
              top: 0,
              bottom: 0,
              justifyContent: 'center'
            }}>
            <Icons.Custom.Search color={colors.$textPrimary} />
          </View>

          <TextInput
            testID="search_bar"
            autoCorrect={false}
            autoComplete="off"
            autoCapitalize="none"
            ref={textInputRef}
            style={{
              flex: 1,
              height: HEIGHT,
              color: colors.$textPrimary,
              paddingLeft: 36,
              paddingVertical: 0,
              marginRight: 36
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.$textSecondary}
            value={_searchText}
            onChangeText={handleTextChange}
            onBlur={() => {
              setIsFocused(false)
            }}
            onFocus={() => {
              setIsFocused(true)
            }}
            underlineColorAndroid="transparent"
            {...rest}
          />
        </View>
        {renderRightComponent()}
      </View>
      {isFocused && useCancel && (
        <Text
          variant="body1"
          style={{
            fontSize: 16,
            lineHeight: 21,
            color: colors.$textPrimary,
            marginStart: 16,
            alignSelf: 'center',
            alignItems: 'center'
          }}
          onPress={onCancel}>
          Cancel
        </Text>
      )}
    </View>
  )
}
