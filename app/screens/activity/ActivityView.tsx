import React, {useCallback, useContext, useEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import SearchSVG from 'components/svg/SearchSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import AvaText from 'components/AvaText';
import Loader from 'components/Loader';
import CollapsibleSection from 'components/CollapsibleSection';
import {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {useWalletContext} from '@avalabs/wallet-react-components';
import ActivityListItem from 'screens/activity/ActivityListItem';

const data: JSON[] = require('assets/coins.json');

interface Props {
  embedded?: boolean;
}
function ActivityView({embedded}: Props) {
  const theme = useContext(ApplicationContext).theme;
  const wallet = useWalletContext()?.wallet;
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const loadDataAsync = async () => {
      console.log('history Items', 'Loading');
      const rawItems = await wallet?.getHistory(20);
      setLoading(false);
      //todo: currently not doing anything with this. just logging.
      console.log('history Items', JSON.stringify(rawItems, null, '\t'));
    };
    loadDataAsync();
  }, [wallet]);

  const today = {
    title: 'Today',
    data: data.slice(0, 5),
  };
  const yesterday = {
    title: 'Yesterday',
    data: data.slice(5, 10),
  };

  const sectionData = [today, yesterday];

  const openDetailBottomSheet = useCallback(() => {
    return navigation.navigate(
      AppNavigation.Modal.TransactionDetailBottomSheet,
    );
  }, []);

  const renderItems = () => {
    return sectionData.map((section, sectionIndex) => {
      return (
        <CollapsibleSection
          key={`${sectionIndex} + ssds`}
          title={section.title}
          startExpanded>
          {section.data.map((item: any) => {
            return (
              <ActivityListItem
                key={item.name}
                tokenName={item.name}
                tokenPrice={item.current_price}
                balance={item.current_price}
                movement={item.price_change_percentage_24h}
                symbol={item.symbol}
                onPress={openDetailBottomSheet}
              />
            );
          })}
        </CollapsibleSection>
      );
    });
  };

  /**
   * if view is embedded, meaning it's used in the bottom sheet (currently), then we wrap it
   * with the appropriate scrollview.
   *
   * We also don't show the 'header'
   * @param children
   */
  const ScrollableComponent = ({children}: {children: React.ReactNode}) =>
    embedded ? (
      <BottomSheetScrollView>{children}</BottomSheetScrollView>
    ) : (
      <ScrollView>{children}</ScrollView>
    );

  return (
    <View style={{flex: 1, backgroundColor: theme.bgApp}}>
      {embedded || (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 16,
          }}>
          <AvaText.Heading1>Activity</AvaText.Heading1>
          <SearchSVG />
        </View>
      )}
      {loading ? <Loader /> : <ScrollableComponent children={renderItems()} />}
    </View>
  );
}

export default ActivityView;
