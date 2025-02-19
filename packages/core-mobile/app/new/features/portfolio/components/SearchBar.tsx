import {
  Dimensions,
  LayoutAnimation,
  Platform,
  TextInputProps,
  ViewStyle,
  TextInput
} from 'react-native'
import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import debounce from 'lodash.debounce'
import { Icons, TouchableOpacity, View, useTheme } from '@avalabs/k2-alpine'

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
  rightIconWhenBlur?: JSX.Element
}

const SCREEN_WIDTH = Dimensions.get('window').width
const INPUT_SIZE = SCREEN_WIDTH - 106
const DEFAULT_DEBOUNCE_MILLISECONDS = 150

/**
 * SearchBar component. Text state is handled outside the
 * component except for when the text is cleared.
 *
 * Shows QRCodeScanner button when search bar is focused.
 * Shows cancel button when input is focused.
 *
 * @param onTextChanged callback to implementing view
 * @param searchText current search text
 * @param placeholder defaults to 'Search'
 * @param debounce if true, will delay calling 'onTextChanged' by default ms
 * @param textColor defaults to theme.colorText2
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
  rightIconWhenBlur,
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

  /**
   * Clears the input by reference and state,
   */
  function clearText(): void {
    textInputRef?.current?.clear()
    onTextChanged('')
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

  return (
    <View
      style={[
        { backgroundColor: colors.$surfaceSecondary, borderRadius: 1000 },
        containerStyle
      ]}>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 12,
          marginVertical: 11
        }}>
        <View
          sx={{
            flexDirection: 'row',
            gap: 11.5,
            alignItems: 'center',
            flex: 1
          }}>
          <Icons.Custom.Search color={colors.$textPrimary} />
          <TextInput
            testID="search_bar__search"
            autoCorrect={false}
            autoComplete="off"
            autoCapitalize="none"
            ref={textInputRef}
            style={{ width: INPUT_SIZE }}
            placeholder={placeholder}
            placeholderTextColor={colors.$textSecondary}
            value={_searchText}
            onChangeText={handleTextChange}
            onBlur={() => {
              Platform.OS === 'ios' && LayoutAnimation.easeInEaseOut()
              setIsFocused(false)
            }}
            onFocus={() => {
              Platform.OS === 'ios' && LayoutAnimation.easeInEaseOut()
              setIsFocused(true)
            }}
            underlineColorAndroid="transparent"
            {...rest}
          />
        </View>
        {searchText && searchText.length > 0 ? (
          <TouchableOpacity onPress={clearText} hitSlop={16}>
            <Icons.Action.Clear color={colors.$textSecondary} />
          </TouchableOpacity>
        ) : (
          rightIconWhenBlur
        )}
      </View>
    </View>
  )
}
