import {
  Dimensions,
  Keyboard,
  LayoutAnimation,
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  ViewStyle
} from 'react-native'
import { View } from '@avalabs/k2-mobile'
import { Opacity50 } from 'resources/Constants'
import SearchSVG from 'components/svg/SearchSVG'
import React, {
  FC,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import ClearSVG from 'components/svg/ClearSVG'
import { useNavigation } from '@react-navigation/native'
import debounce from 'lodash.debounce'
import AvaText from './AvaText'
import AvaButton from './AvaButton'

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  onTextChanged: (value: string) => void
  searchText: string
  placeholder?: string
  hideBottomNav?: boolean
  useDebounce?: boolean
  debounceMillis?: number
  textColor?: string
  testID?: string
  setSearchBarFocused?: (value: boolean) => void
  containerStyle?: ViewStyle
  accessoryView?: JSX.Element
}

const SCREEN_WIDTH = Dimensions.get('window').width
const INPUT_SIZE = SCREEN_WIDTH - 82
const INPUT_SIZE_FOCUSED = SCREEN_WIDTH - 160
const INPUT_SIZE_FOCUSED_SHOWING_CLEAR = SCREEN_WIDTH - 188
const INPUT_SIZE_WITH_ACCESSORY_VIEW = INPUT_SIZE_FOCUSED
const DEFAULT_DEBOUNCE_MILLISECONDS = 150

/**
 * SearchBar component. Text state is handled outside the
 * component except for when the text is cleared.
 *
 * Shows clear button when there's text present.
 * Shows cancel button when input is focused.
 *
 * @param onTextChanged callback to implementing view
 * @param searchText current search text
 * @param placeholder defaults to 'Search'
 * @param hideBottomNav attempts to hide bottom tabs, gives more space
 * @param debounce if true, will delay calling 'onTextChanged' by default ms
 * @param textColor defaults to theme.colorText2
 * @param rest all other props
 * @constructor
 */
const SearchBar: FC<Props> = ({
  onTextChanged,
  searchText,
  placeholder = 'Search',
  hideBottomNav = false,
  useDebounce = false,
  debounceMillis = DEFAULT_DEBOUNCE_MILLISECONDS,
  textColor,
  setSearchBarFocused,
  containerStyle,
  accessoryView,
  ...rest
}) => {
  const textInputRef = useRef<TextInput>(null)
  const navigation = useNavigation()
  const { theme } = useApplicationContext()
  const [isFocused, setIsFocused] = useState(false)
  const [_searchText, _setSearchText] = useState(searchText)
  useLayoutEffect(keyboardListenerFx, [hideBottomNav, navigation])

  useEffect(() => {
    setSearchBarFocused?.(isFocused)
  }, [isFocused, setSearchBarFocused])

  /**
   * An attempt to hide bottom tabs when the search is focused.
   * It's kinda working.
   */
  function keyboardListenerFx(): (() => void) | undefined {
    if (!hideBottomNav) {
      return
    }
    const sub1 = Keyboard.addListener('keyboardDidShow', _ => {
      navigation.setOptions({
        tabBarStyle: { display: 'none' }
      })
    })
    const sub2 = Keyboard.addListener('keyboardDidHide', _ => {
      navigation.setOptions({
        tabBarStyle: { display: 'flex' }
      })
    })

    return () => {
      sub1.remove()
      sub2.remove()
    }
  }

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

  /**
   * Sets isEmpty.
   * Used to determine if we show the clear button or not
   * and used to tweak input's width
   */
  let isEmpty = false
  if (isFocused && searchText && searchText.length > 0) {
    isEmpty = true
  }

  /**
   * Sets textInputWidth
   * Used to the set the width and animate based on that.
   */
  let textInputWidth = INPUT_SIZE

  if (isEmpty) {
    textInputWidth = INPUT_SIZE_FOCUSED_SHOWING_CLEAR
  } else if (isFocused) {
    textInputWidth = INPUT_SIZE_FOCUSED
  } else if (accessoryView) {
    textInputWidth = INPUT_SIZE_WITH_ACCESSORY_VIEW
  }

  return (
    <View style={[styles.searchContainer, containerStyle]}>
      <View
        style={[
          styles.searchBackground,
          { backgroundColor: theme.colorBg3 + Opacity50 }
        ]}>
        <SearchSVG size={32} hideBorder />
        <TextInput
          testID="search_bar__search"
          autoCorrect={false}
          autoComplete="off"
          autoCapitalize="none"
          keyboardAppearance={'dark'}
          ref={textInputRef}
          style={[
            styles.searchInput,
            {
              color: textColor ?? theme.colorText2,
              width: textInputWidth,
              textAlign: 'left'
            }
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colorText2}
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
        {isEmpty && (
          <TouchableOpacity style={{ marginEnd: 4 }} onPress={clearText}>
            <ClearSVG color={theme.background} backgroundColor={theme.white} />
          </TouchableOpacity>
        )}
      </View>
      {!isFocused && accessoryView && (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignSelf: 'center'
          }}>
          {accessoryView}
        </View>
      )}
      {isFocused && (
        <AvaButton.Base
          style={{
            marginStart: 16,
            alignSelf: 'center',
            alignItems: 'center'
          }}
          onPress={onCancel}>
          <AvaText.ButtonLarge color={'#0A84FF'}>Cancel</AvaText.ButtonLarge>
        </AvaButton.Base>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center'
  },
  searchBackground: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    height: 40,
    paddingLeft: 12,
    paddingRight: 8,
    marginVertical: 8
  },
  searchInput: {
    paddingLeft: 4
  }
})

export default SearchBar
