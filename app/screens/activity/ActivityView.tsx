import React, {useCallback, useEffect, useState} from 'react';
import {Animated, RefreshControl, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import AvaText from 'components/AvaText';
import Loader from 'components/Loader';
import CollapsibleSection from 'components/CollapsibleSection';
import {
  useNetworkContext,
  useWalletContext,
} from '@avalabs/wallet-react-components';
import moment from 'moment';
import ActivityListItem from 'screens/activity/ActivityListItem';
import {HistoryItemType} from '@avalabs/avalanche-wallet-sdk/dist/History';
import {History} from '@avalabs/avalanche-wallet-sdk';
import {ScrollView} from 'react-native-gesture-handler';
import {MainHeaderOptions} from 'navigation/NavUtils';
import {PortfolioNavigationProp} from 'screens/portfolio/PortfolioView';

const DISPLAY_FORMAT_CURRENT_YEAR = 'MMMM DD';
const DISPLAY_FORMAT_PAST_YEAR = 'MMMM DD, YYYY';

const TODAY = moment();
const YESTERDAY = moment().subtract(1, 'days');
type SectionType = {[x: string]: HistoryItemType[]};

interface Props {
  embedded?: boolean;
}

function ActivityView({embedded}: Props): JSX.Element {
  const wallet = useWalletContext()?.wallet;
  const network = useNetworkContext()?.network;
  const [sectionData, setSectionData] = useState<SectionType>({});
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<PortfolioNavigationProp>();

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const history = (await wallet?.getHistory(50)) ?? [];
    // We're only going to show EVMT without inputs at this time. Remove filter in the future
    const newSectionData: SectionType = {};
    history
      .filter(ik => History.isHistoryEVMTx(ik) && ik.input === undefined)
      .map((it: HistoryItemType) => {
        const date = moment(it.timestamp);
        if (TODAY.isSame(date, 'day')) {
          newSectionData.Today = [...[it]];
        } else if (YESTERDAY.isSame(date, 'day')) {
          newSectionData.Yesterday = [...[it]];
        } else {
          const isCurrentYear = TODAY.year() === date.year();
          newSectionData[
            date.format(
              isCurrentYear
                ? DISPLAY_FORMAT_CURRENT_YEAR
                : DISPLAY_FORMAT_PAST_YEAR,
            )
          ] = [...[it]];
        }
      });
    setSectionData(newSectionData);
    setLoading(false);
  }, [wallet]);

  useEffect(() => {
    if (embedded) {
      navigation.setOptions({headerShown: false});
    } else {
      navigation.setOptions({
        ...MainHeaderOptions('Activity'),
        headerStyle: {
          shadowColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
      });
    }
  }, [embedded]);

  useEffect(() => {
    loadHistory().catch(reason => console.warn(reason));
  }, [network]);

  const openDetailBottomSheet = useCallback((item: HistoryItemType) => {
    return navigation.navigate(
      AppNavigation.Modal.TransactionDetailBottomSheet,
      {historyItem: item},
    );
  }, []);

  const renderItems = () => {
    const items = Object.entries(sectionData).map((key, index) => {
      return (
        <View>
          <Animated.View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 16,
              marginRight: 8,
            }}>
            <AvaText.ActivityTotal>{key[0]}</AvaText.ActivityTotal>
          </Animated.View>
          {key[1].map((item: HistoryItemType) => (
            <ActivityListItem
              key={item.id}
              historyItem={item}
              onPress={() => openDetailBottomSheet(item)}
            />
          ))}
        </View>
      );
    });

    if (items.length > 0) {
      return items;
    }

    // if no items we return zero state
    return (
      // replace with zero states once we have them
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          marginHorizontal: 16,
        }}>
        <AvaText.Heading3 textStyle={{textAlign: 'center'}}>
          As transactions take place, they will show up here.
        </AvaText.Heading3>
      </View>
    );
  };

  function onRefresh() {
    loadHistory();
  }

  /**
   * if view is embedded, meaning it's used in the bottom sheet (currently), then we wrap it
   * with the appropriate scrollview.
   *
   * We also don't show the 'header'
   * @param children
   */
  const ScrollableComponent = ({children}: {children: React.ReactNode}) => {
    const isEmpty = Object.entries(sectionData).length === 0;

    return embedded ? (
      <ScrollView
        style={{flex: 1}}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }>
        {children}
      </ScrollView>
    ) : (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={
          isEmpty && {flex: 1, justifyContent: 'center', alignItems: 'center'}
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }>
        {children}
      </ScrollView>
    );
  };

  return !wallet || loading ? (
    <Loader />
  ) : (
    <View style={{flex: 1}}>
      <ScrollableComponent children={renderItems()} />
    </View>
  );
}

export default ActivityView;
