import React, { useState } from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import TabViewAva from 'components/TabViewAva'
import {
  WatchlistTokens,
  TokenSearchResults
} from 'screens/watchlist/WatchlistTokens'
import { Space } from 'components/Space'
import CommonSearchBar from 'components/SearchBar'
import { FavoriteTokens } from 'screens/watchlist/FavoriteTokens'
import {
  useWatchlistContext,
  WatchlistContextProvider
} from 'contexts/WatchlistContext'
import { TrendingTokens } from './TrendingTokens'

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

const SearchBar = (): React.JSX.Element => {
  const { searchText, setSearchText } = useWatchlistContext()

  return (
    <CommonSearchBar
      onTextChanged={setSearchText}
      searchText={searchText}
      hideBottomNav
      useDebounce
    />
  )
}

const Content = (): React.JSX.Element => {
  const { searchText } = useWatchlistContext()
  const [tabIndex, setTabIndex] = useState(0)

  const renderLabel = (title: string, focused: boolean): JSX.Element => {
    return <CustomLabel focused={focused} title={title} />
  }

  return (
    <>
      {searchText && searchText.length > 0 ? (
        <>
          <Space y={32} />
          <AvaText.Heading3 textStyle={{ marginStart: 16 }}>
            Results
          </AvaText.Heading3>
          <TokenSearchResults />
        </>
      ) : (
        <TabViewAva
          renderLabel={renderLabel}
          currentTabIndex={tabIndex}
          onTabIndexChange={setTabIndex}>
          <TabViewAva.Item title={'Trending'}>
            <TrendingTokens />
          </TabViewAva.Item>
          <TabViewAva.Item title={'Favorites'}>
            <FavoriteTokens onTabIndexChanged={setTabIndex} />
          </TabViewAva.Item>
          <TabViewAva.Item title={'All'}>
            <WatchlistTokens />
          </TabViewAva.Item>
        </TabViewAva>
      )}
    </>
  )
}

export const WatchlistScreen = (): JSX.Element => {
  return (
    <WatchlistContextProvider>
      <View style={{ flex: 1 }}>
        <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
          Watchlist
        </AvaText.LargeTitleBold>
        <Space y={10} />
        <SearchBar />
        <Content />
      </View>
    </WatchlistContextProvider>
  )
}
