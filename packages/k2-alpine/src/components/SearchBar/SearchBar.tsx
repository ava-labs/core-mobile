import {
  Dimensions,
  LayoutAnimation,
  Platform,
  TextInputProps,
  ViewStyle,
  TextInput
} from 'react-native'
import React, {
  FC,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import debounce from 'lodash.debounce'
import { TouchableOpacity, View } from '../Primitives'
import { useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  ref?: RefObject<TextInput>
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
}

const SCREEN_WIDTH = Dimensions.get('window').width
const INPUT_SIZE = SCREEN_WIDTH - 106
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
  ref,
  onTextChanged,
  searchText,
  placeholder = 'Search',
  useDebounce = false,
  debounceMillis = DEFAULT_DEBOUNCE_MILLISECONDS,
  textColor,
  setSearchBarFocused,
  containerStyle,
  rightComponent,
  ...rest
}) => {
  const _textInputRef = useRef<TextInput>(null)
  const textInputRef = ref || _textInputRef
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
    textInputRef.current?.blur()
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

  const renderRightComponent = (): React.JSX.Element | undefined => {
    if (searchText.length > 0) {
      return (
        <TouchableOpacity
          onPress={clearText}
          hitSlop={16}
          sx={{ justifyContent: 'center', alignItems: 'center' }}>
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
    <View
      style={[
        {
          backgroundColor: colors.$surfaceSecondary,
          borderRadius: 1000,
          height: HEIGHT,
          justifyContent: 'center'
        },
        containerStyle
      ]}>
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 12,
          marginVertical: Platform.OS === 'ios' ? 11 : 0
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
            style={{ width: INPUT_SIZE, color: colors.$textPrimary }}
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
        {renderRightComponent()}
      </View>
    </View>
  )
}
