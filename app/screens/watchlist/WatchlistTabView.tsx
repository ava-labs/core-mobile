import React, {useMemo, useState} from 'react';
import {View} from 'react-native';
import AvaText from 'components/AvaText';
import {useApplicationContext} from 'contexts/ApplicationContext';
import TabViewAva from 'components/TabViewAva';
import WatchlistView from 'screens/watchlist/WatchlistView';
import {Space} from 'components/Space';
import SearchBar from 'components/SearchBar';

export default function WatchlistTab() {
  const theme = useApplicationContext().theme;
  const [searchText, setSearchText] = useState('');

  const renderCustomLabel = (title: string, focused: boolean) => {
    return (
      <AvaText.Heading3
        textStyle={{color: focused ? theme.colorText1 : theme.colorText2}}>
        {title}
      </AvaText.Heading3>
    );
  };

  const allWatchList = useMemo(
    () => <WatchlistView title={'All'} searchText={searchText} />,
    [searchText],
  );

  return (
    <View style={{flex: 1}}>
      <SearchBar
        onTextChanged={setSearchText}
        searchText={searchText}
        hideBottomNav
      />
      {searchText && searchText?.length > 0 ? (
        <>
          <Space y={32} />
          <AvaText.Heading3 textStyle={{marginStart: 16}}>
            Results
          </AvaText.Heading3>
          {allWatchList}
        </>
      ) : (
        <TabViewAva renderCustomLabel={renderCustomLabel}>
          {allWatchList}
          <WatchlistView title={'Favorites'} showFavorites />
        </TabViewAva>
      )}
    </View>
  );
}
