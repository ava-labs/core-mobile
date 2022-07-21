import React, { useMemo, useState } from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import TabViewAva from 'components/TabViewAva'
import WatchlistView from 'screens/watchlist/WatchlistView'
import { Space } from 'components/Space'
import SearchBar from 'components/SearchBar'

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

export default function WatchlistTab() {
  const [searchText, setSearchText] = useState('')

  const renderCustomLabel = (title: string, focused: boolean) => {
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
        <TabViewAva renderCustomLabel={renderCustomLabel}>
          <TabViewAva.Item title={'All'}>{allWatchList}</TabViewAva.Item>
          <TabViewAva.Item title={'Favorites'}>
            <WatchlistView showFavorites />
          </TabViewAva.Item>
        </TabViewAva>
      )}
    </View>
  )
}
