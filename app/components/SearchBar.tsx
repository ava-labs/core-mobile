import {
  Dimensions,
  LayoutAnimation,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View
} from 'react-native'
import { Opacity50 } from 'resources/Constants'
import SearchSVG from 'components/svg/SearchSVG'
import React, { FC, useLayoutEffect, useRef, useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import ClearSVG from 'components/svg/ClearSVG'
import { useNavigation } from '@react-navigation/native'
import AvaText from './AvaText'
import AvaButton from './AvaButton'

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  onTextChanged: (value: string) => void
  searchText: string
  placeholder?: string
  hideBottomNav?: boolean
}

const SCREEN_WIDTH = Dimensions.get('window').width
const INPUT_SIZE = SCREEN_WIDTH - 82
const INPUT_SIZE_FOCUSED = SCREEN_WIDTH - 160
const INPUT_SIZE_FOCUSED_SHOWING_CLEAR = SCREEN_WIDTH - 188

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
 * @param rest all other props
 * @constructor
 */
const SearchBar: FC<Props> = ({
  onTextChanged,
  searchText,
  placeholder = 'Search',
  hideBottomNav = false,
  ...rest
}) => {
  const textInputRef = useRef<TextInput>(null)
  const navigation = useNavigation()
  const { theme } = useApplicationContext()
  const [isFocused, setIsFocused] = useState(false)

  /**
   * An attempt to hide bottom tabs when the search is focused.
   * It's kinda working.
   */
  useLayoutEffect(() => {
    if (hideBottomNav) {
      navigation.setOptions({
        tabBarStyle: { display: isFocused ? 'none' : 'flex' }
      })
    }
  }, [isFocused])

  /**
   * Clears the input by reference and state,
   */
  function clearText() {
    textInputRef?.current?.clear()
    onTextChanged('')
  }

  /**
   * Sets the behavior for when the user cancels
   * the search
   */
  function onCancel() {
    setIsFocused(false)
    clearText()
    textInputRef.current?.blur()
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
   * Used to the set the with and animate based on that.
   */
  let textInputWidth = INPUT_SIZE
  if (isEmpty) {
    textInputWidth = INPUT_SIZE_FOCUSED_SHOWING_CLEAR
  } else if (isFocused) {
    textInputWidth = INPUT_SIZE_FOCUSED
  }

  return (
    <View style={styles.searchContainer}>
      <View
        style={[
          styles.searchBackground,
          { backgroundColor: theme.colorBg3 + Opacity50 }
        ]}>
        <SearchSVG size={32} hideBorder />
        <TextInput
          autoCorrect={false}
          autoCompleteType={'off'}
          autoCapitalize="none"
          keyboardAppearance={'dark'}
          ref={textInputRef}
          style={[
            styles.searchInput,
            { color: theme.colorText2, width: textInputWidth }
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colorText2}
          value={searchText}
          onChangeText={onTextChanged}
          onBlur={() => {
            LayoutAnimation.easeInEaseOut()
            setIsFocused(false)
          }}
          onFocus={() => {
            LayoutAnimation.easeInEaseOut()
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
      {isFocused && (
        <AvaButton.Base style={{ marginStart: 16 }} onPress={onCancel}>
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
