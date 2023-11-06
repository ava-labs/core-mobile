import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import AvaText from 'components/AvaText'
import SearchBar from 'components/SearchBar'
// import { useSelector } from 'react-redux'
// import { selectIsTabEmpty } from 'store/browser/slices/tabs'
import MOCK_PROTOCOL_INFORMATION_DATA from 'tests/fixtures/browser/protocolInformationListData.json'
import { DeFiProtocolInformation } from 'services/browser/types'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import Avatar from 'components/Avatar'
import { getTopDefiProtocolInformationList } from './utils'

const Favorites = (): JSX.Element => {
  return (
    <View>
      <AvaText.Heading5>Favorites</AvaText.Heading5>
    </View>
  )
}

const SuggestedSites = (): JSX.Element => {
  return (
    <View>
      <AvaText.Heading5>Suggested Sites</AvaText.Heading5>
    </View>
  )
}

const TokenLogo = (
  logoUrl: string,
  siteUrl: string,
  name: string
): JSX.Element => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Avatar.Custom
        name={name}
        siteUri={siteUrl}
        logoUri={logoUrl}
        showBorder
      />
    </View>
  )
}

export default function TabViewScreen(): JSX.Element {
  const [searchText, setSearchText] = useState('')
  const handleSearch = (text: string) => {
    setSearchText(text)
  }
  // const selectTabIsEmpty = useSelector(selectIsTabEmpty)
  const firstEightItems = getTopDefiProtocolInformationList(
    MOCK_PROTOCOL_INFORMATION_DATA as unknown as DeFiProtocolInformation[]
  )
  return (
    <View style={styles.container}>
      <View>
        <SearchBar
          placeholder="Search or Type URL"
          onTextChanged={handleSearch}
          searchText={searchText}
          hideBottomNav
          useDebounce
        />
      </View>
      <View>
        <Row>
          <Favorites />
        </Row>
        {firstEightItems.map(({ name, siteUrl, logoUrl }, index) => {
          const imageUris = [logoUrl].filter(Boolean) as string[]
          const siteUris = [siteUrl].filter(Boolean) as string[]
          return (
            <View key={`dapp-site-${index}`}>
              <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
                <Row>
                  <Avatar.Custom
                    name={name}
                    siteUri={siteUris[0]}
                    logoUri={imageUris[0]}
                    showBorder
                  />
                </Row>
              </Row>
            </View>
          )
        })}
        <Row>
          <SuggestedSites />
        </Row>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flexWrap: 'wrap'
  }
})
