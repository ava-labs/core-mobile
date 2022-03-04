import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Animated, RefreshControl, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import AvaText from 'components/AvaText';
import Loader from 'components/Loader';
import {
  getHistory,
  TransactionERC20,
  TransactionNormal,
  useNetworkContext,
  useWalletContext,
} from '@avalabs/wallet-react-components';
import moment from 'moment';
import {ScrollView} from 'react-native-gesture-handler';
import {MainHeaderOptions} from 'navigation/NavUtils';
import ActivityListItem from 'screens/activity/ActivityListItem';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from 'navigation/WalletScreenStack';

const DISPLAY_FORMAT_CURRENT_YEAR = 'MMMM DD';
const DISPLAY_FORMAT_PAST_YEAR = 'MMMM DD, YYYY';

interface Props {
  embedded?: boolean;
  tokenSymbolFilter?: string;
}

export type TxType = TransactionNormal | TransactionERC20;
const TODAY = moment();
const YESTERDAY = moment().subtract(1, 'days');
type SectionType = {[x: string]: TxType[]};

function ActivityList({embedded, tokenSymbolFilter}: Props) {
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const wallet = useWalletContext()?.wallet;
  const {network} = useNetworkContext()!;
  const [allHistory, setAllHistory] = useState<
    (TransactionNormal | TransactionERC20)[]
  >([]);

  const sectionData = useMemo(() => {
    const newSectionData: SectionType = {};
    allHistory
      .filter((tx: TxType) => {
        console.log('tokenSymbolFilter', tokenSymbolFilter);
        return tokenSymbolFilter
          ? tokenSymbolFilter === (tx?.tokenSymbol ?? 'AVAX')
          : true;
      })
      .forEach((it: TxType) => {
        const date = moment(it.timestamp);
        if (TODAY.isSame(date, 'day')) {
          const today = newSectionData.Today;
          newSectionData.Today = today
            ? [...newSectionData.Today, it]
            : [...[it]];
        } else if (YESTERDAY.isSame(date, 'day')) {
          const yesterday = newSectionData.Yesterday;
          newSectionData.Yesterday = yesterday
            ? [...newSectionData.Yesterday, it]
            : [...[it]];
        } else {
          const isCurrentYear = TODAY.year() === date.year();
          const titleDate = date.format(
            isCurrentYear
              ? DISPLAY_FORMAT_CURRENT_YEAR
              : DISPLAY_FORMAT_PAST_YEAR,
          );
          const otherDate = newSectionData[titleDate];
          newSectionData[titleDate] = otherDate
            ? [...newSectionData[titleDate], it]
            : [...[it]];
        }
      });
    return newSectionData;
  }, [allHistory, tokenSymbolFilter]);

  useEffect(() => {
    loadHistory().then();
  }, [wallet, network]);

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

  const loadHistory = async () => {
    if (!wallet) {
      return [];
    }
    setLoading(true);
    setAllHistory((await getHistory(wallet, 50)) ?? []);
    setLoading(false);
  };

  const openTransactionDetails = useCallback((item: TxType) => {
    return navigation.navigate(AppNavigation.Wallet.ActivityDetail, {
      tx: item,
    });
  }, []);

  const renderItems = () => {
    const items = Object.entries(sectionData).map(key => {
      return (
        <View key={key[0]}>
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
          {key[1].map((item: TxType, index) => (
            <ActivityListItem
              key={item.transactionIndex + index}
              tx={item}
              onPress={() => openTransactionDetails(item)}
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
    loadHistory().then();
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
          isEmpty
            ? {flex: 1, justifyContent: 'center', alignItems: 'center'}
            : {
                marginVertical: 4,
              }
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

export default ActivityList;
