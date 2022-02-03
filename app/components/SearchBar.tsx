import {StyleSheet, TextInput, View} from 'react-native';
import {Opacity50} from 'resources/Constants';
import SearchSVG from 'components/svg/SearchSVG';
import React, {useEffect, useState} from 'react';
import {useApplicationContext} from 'contexts/ApplicationContext';

const SearchBar = ({
  onTextChanged,
  initSearchText,
}: {
  onTextChanged: (value: string) => void;
  initSearchText?: string;
}) => {
  const {theme} = useApplicationContext();
  const [searchText, setSearchText] = useState(initSearchText);
  useEffect(() => {
    if (initSearchText) {
      setSearchText(initSearchText);
    }
  }, [initSearchText]);

  const onChangeText = (value: string) => {
    setSearchText(value);
    onTextChanged(value);
  };

  return (
    <View style={styles.searchContainer}>
      <View
        style={[
          styles.searchBackground,
          {backgroundColor: theme.colorBg3 + Opacity50},
        ]}>
        <SearchSVG color={theme.onBgSearch} size={32} hideBorder />
        <TextInput
          style={[styles.searchInput, {color: theme.txtOnBgApp}]}
          placeholder="Search"
          placeholderTextColor={theme.onBgSearch}
          value={searchText}
          onChangeText={onChangeText}
          underlineColorAndroid="transparent"
          accessible
          clearButtonMode="always"
          autoCapitalize="none"
          numberOfLines={1}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
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

export default SearchBar;
