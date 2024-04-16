import React, { useMemo, useState } from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import TabViewAva from 'components/TabViewAva'
import WatchlistView from 'screens/watchlist/WatchlistView'
import { Space } from 'components/Space'
import SearchBar from 'components/SearchBar'
import { useSelector } from 'react-redux'
import { selectWatchlistFavoritesIsEmpty } from 'store/watchlist'
import FavoriteWatchlistView from 'screens/watchlist/FavoriteWatchlistView'

const CustomLabel: React.FC<{ focused: boolean; title: string }> = ({
  focused,
  title
}) => {
  const theme = useApplicationContext().theme

  return (
    <AvaText.Heading3
      textStyle={{ color: focused ? theme.colorText1 : theme.colorText2 }}>
      {title}
    </AvaText.Heading3>
  )
}

export default function WatchlistTab(): JSX.Element {
  const isWatchlistFavoritesEmpty = useSelector(selectWatchlistFavoritesIsEmpty)
  const [searchText, setSearchText] = useState('')
  const [tabIndex, setTabIndex] = useState(isWatchlistFavoritesEmpty ? 1 : 0)

  const renderCustomLabel = (title: string, focused: boolean): JSX.Element => {
    return <CustomLabel focused={focused} title={title} />
  }

  const allWatchList = useMemo(
    () => <WatchlistView searchText={searchText} />,
    [searchText]
  )

  return (
    <View style={{ flex: 1 }}>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        Watchlist
      </AvaText.LargeTitleBold>
      <Space y={10} />
      <SearchBar
        onTextChanged={setSearchText}
        searchText={searchText}
        hideBottomNav
        useDebounce
      />
      {searchText && searchText?.length > 0 ? (
        <>
          <Space y={32} />
          <AvaText.Heading3 textStyle={{ marginStart: 16 }}>
            Results
          </AvaText.Heading3>
          {allWatchList}
        </>
      ) : (
        <TabViewAva
          renderCustomLabel={renderCustomLabel}
          currentTabIndex={tabIndex}
          onTabIndexChange={setTabIndex}>
          <TabViewAva.Item title={'Favorites'}>
            <FavoriteWatchlistView onTabIndexChanged={setTabIndex} />
          </TabViewAva.Item>
          <TabViewAva.Item title={'All'}>{allWatchList}</TabViewAva.Item>
        </TabViewAva>
      )}
    </View>
  )
}
