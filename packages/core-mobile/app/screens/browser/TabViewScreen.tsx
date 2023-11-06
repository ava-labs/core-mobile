import React, { useState } from 'react'
import { View, StyleSheet, Linking } from 'react-native'
import AvaText from 'components/AvaText'
import SearchBar from 'components/SearchBar'
// import { useSelector } from 'react-redux'
// import { selectIsTabEmpty } from 'store/browser/slices/tabs'
import MOCK_PROTOCOL_INFORMATION_DATA from 'tests/fixtures/browser/protocolInformationListData.json'
import { DeFiProtocolInformation } from 'services/browser/types'
import { Row } from 'components/Row'
import AvaButton from 'components/AvaButton'
import Avatar from 'components/Avatar'
import Logger from 'utils/Logger'
import { FlatList } from 'react-native-gesture-handler'
import { getTopDefiProtocolInformationList } from './utils'

type Props = {
  siteUrl?: string | undefined
  logoUrl?: string | undefined
  name: string | null
  id?: string
  chain?: string
}

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

function goToDappSite(dappUrl: string): void {
  Linking.openURL(dappUrl).catch(e => {
    Logger.error(dappUrl, e)
  })
}

const DappLogo = ({ name, logoUrl }: Props): JSX.Element => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Avatar.Custom name={name !== null ? name : ''} logoUri={logoUrl} />
    </View>
  )
}

const renderItemList = (item: Props): JSX.Element => {
  const { name, siteUrl, logoUrl } = item
  return (
    <View style={{ paddingHorizontal: 16, width: '25%', alignItems: 'center' }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row>
          <DappLogo name={name} logoUrl={logoUrl} />
        </Row>
        <Row>
          <AvaButton.Icon
            onPress={() => {
              goToDappSite(siteUrl as string)
            }}
          />
        </Row>
      </Row>
      <Row style={{ alignItems: 'center' }}>
        <AvaText.Body3>{name}</AvaText.Body3>
      </Row>
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
      <Row>
        <SearchBar
          placeholder="Search or Type URL"
          onTextChanged={handleSearch}
          searchText={searchText}
          hideBottomNav
          useDebounce
        />
      </Row>
      <View style={{ paddingLeft: 16 }}>
        <Row>
          <SuggestedSites />
        </Row>
        <Row>
          <View>
            <FlatList
              data={firstEightItems}
              contentContainerStyle={{ paddingBottom: 16 }}
              numColumns={4}
              renderItem={item => renderItemList(item.item)}
            />
          </View>
        </Row>
        <Row>
          <Favorites />
        </Row>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16
  }
})
