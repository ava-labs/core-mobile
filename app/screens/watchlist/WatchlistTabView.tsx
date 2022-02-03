import React, {useMemo, useState} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import AvaText from 'components/AvaText';
import {Opacity50} from 'resources/Constants';
import SearchSVG from 'components/svg/SearchSVG';
import {useApplicationContext} from 'contexts/ApplicationContext';
import TabViewAva from 'components/TabViewAva';
import WatchlistView from 'screens/watchlist/WatchlistView';
import debounce from 'lodash.debounce';

export default function WatchlistTab() {
  const theme = useApplicationContext().theme;
  const [searchText, setSearchText] = useState('');
  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  const context = useApplicationContext();

  const renderCustomLabel = (title: string, focused: boolean) => {
    return (
      <AvaText.Heading3
        textStyle={{color: focused ? theme.colorText1 : theme.colorText2}}>
        {title}
      </AvaText.Heading3>
    );
  };

  const debounceTabChange = useMemo(() => {
    return debounce(() => {
      if (currentTabIndex !== 0) {
        setCurrentTabIndex(0);
      }
    }, 300);
  }, []);

  function handleSearch(text: string) {
    setSearchText(text);
    debounceTabChange();
  }

  return (
    <View style={{flex: 1}}>
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBackground,
            {backgroundColor: context.theme.colorBg3 + Opacity50},
          ]}>
          <SearchSVG color={context.theme.onBgSearch} size={32} hideBorder />
          <TextInput
            style={[styles.searchInput, {color: context.theme.txtOnBgApp}]}
            placeholder="Search all tokens"
            placeholderTextColor={context.theme.onBgSearch}
            value={searchText}
            onChangeText={handleSearch}
            underlineColorAndroid="transparent"
            accessible
            clearButtonMode="always"
            autoCapitalize="none"
            numberOfLines={1}
          />
        </View>
      </View>

      <TabViewAva
        renderCustomLabel={renderCustomLabel}
        currentTabIndex={currentTabIndex}
        onTabIndexChange={setCurrentTabIndex}>
        <WatchlistView title={'All'} searchText={searchText} />
        <WatchlistView title={'Favorites'} showFavorites />
      </TabViewAva>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  searchBackground: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    height: 40,
    flex: 1,
    justifyContent: 'center',
    paddingStart: 12,
  },
  searchInput: {
    paddingLeft: 4,
    height: 40,
    flex: 1,
    marginRight: 24,
    fontSize: 16,
  },
});
