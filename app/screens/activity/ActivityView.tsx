import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ListRenderItemInfo,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import SearchSVG from 'components/svg/SearchSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {useNavigation} from '@react-navigation/native';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaListItem from 'components/AvaListItem';
import {keyExtractor} from 'screens/portfolio/PortfolioView';
// @ts-ignore no-type-def-available
import CarrotSVG from 'components/svg/CarrotSVG';
import AppNavigation from 'navigation/AppNavigation';
import AvaText from 'components/AvaText';
import Loader from 'components/Loader';
// @ts-ignore javascript-no-type-def
import CollapsibleView from '@eliav2/react-native-collapsible-view';
import CollapsibleSection from 'components/CollapsibleSection';
import {BottomSheetScrollView} from '@gorhom/bottom-sheet';

const data: JSON[] = require('assets/coins.json');

interface Props {
  embedded?: boolean;
}
function ActivityView({embedded}: Props) {
  const theme = useContext(ApplicationContext).theme;
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

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
              <AvaListItem.Activity
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
      {loading ? (
        <Loader showLogo={false} />
      ) : (
        <ScrollableComponent children={renderItems()} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
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

export default ActivityView;
