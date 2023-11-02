import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import AvaText from 'components/AvaText'
import SearchBar from 'components/SearchBar'
import { useSelector } from 'react-redux'
import { selectIsTabEmpty } from 'store/browser'

export default function TabViewScreen(): JSX.Element {
  const [searchText, setSearchText] = useState('')
  const handleSearch = (text: string) => {
    setSearchText(text)
  }
  const selectTabIsEmpty = useSelector(selectIsTabEmpty)

  return (
    <View style={styles.container}>
      <View>
      <SearchBar 
        placeholder='Search or Type URL'
        onTextChanged={handleSearch}
        searchText={searchText}
        hideBottomNav
        useDebounce
      />
      </View>
      <View>
        <AvaText.Heading5>History</AvaText.Heading5>
      </View>
      
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flexWrap: 'wrap',
  }
})