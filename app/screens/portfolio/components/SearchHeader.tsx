import SearchSVG from 'components/svg/SearchSVG';
import React, {RefObject, useContext, useEffect, useRef, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ClearSVG from 'components/svg/ClearSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AddSVG from 'components/svg/AddSVG';

export interface SearchHeaderProps {
  searchText?: string;
  onSearchTextChanged: (text: string) => void;
  listRef?: RefObject<FlatList>;
}

function SearchHeader({
  searchText = '',
  onSearchTextChanged,
  listRef,
}: SearchHeaderProps) {
  const textInputRef = useRef<TextInput>(null);
  const [active, setActive] = useState(false);
  const context = useContext(ApplicationContext);

  function onCancel() {
    console.log('on cancel pressed');
    onSearchTextChanged('');
    textInputRef?.current?.blur();
    setActive(false);
  }

  useEffect(() => {
    if (active) {
      textInputRef?.current?.focus();
      listRef?.current?.scrollToIndex({
        animated: true,
        index: 0,
      });
    }
  }, [active]);

  return (
    <View
      // while we wait for the proper background from UX
      style={{
        backgroundColor: context.theme.bgApp,
      }}>
      <View
        style={[styles.container, {backgroundColor: context.theme.bgOnBgApp}]}>
        <TouchableOpacity>
          <AddSVG />
        </TouchableOpacity>
        <Text style={styles.title}>Tokens</Text>
        <TouchableOpacity
          onPress={() => {
            setActive(true);
          }}>
          <SearchSVG />
        </TouchableOpacity>
      </View>
      {active && (
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBackground,
              {backgroundColor: context.theme.bgSearch},
            ]}>
            <SearchSVG color={context.theme.onBgSearch} />
            <TextInput
              ref={textInputRef}
              style={[styles.searchInput, {color: context.theme.txtOnBgApp}]}
              placeholder="Search"
              placeholderTextColor={context.theme.onBgSearch}
              value={searchText}
              onChangeText={onSearchTextChanged}
              underlineColorAndroid="transparent"
              accessible
            />
          </View>
          <TouchableOpacity style={{paddingLeft: 16}} onPress={onCancel}>
            <ClearSVG
              size={44}
              color={context.theme.onBgSearch}
              backgroundColor={context.theme.bgSearch}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    borderTopRightRadius: 25,
    borderTopLeftRadius: 25,
  },
  title: {fontSize: 14, lineHeight: 17, color: '#B4B4B7'},
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'absolute',
  },
  searchBackground: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    height: 45,
    flex: 1,
    justifyContent: 'center',
  },
  searchInput: {
    paddingLeft: 4,
    height: 44,
    flex: 1,
    paddingRight: 16,
    fontSize: 16,
    lineHeight: 24,
  },
});

export default SearchHeader;
