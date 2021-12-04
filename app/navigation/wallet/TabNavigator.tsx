import AppNavigation from 'navigation/AppNavigation';
import HomeSVG from 'components/svg/HomeSVG';
import ActivitySVG from 'components/svg/ActivitySVG';
import SwapSVG from 'components/svg/SwapSVG';
import MoreSVG from 'components/svg/MoreSVG';
import WatchlistSVG from 'components/svg/WatchlistSVG';
import WatchlistView from 'screens/watchlist/WatchlistView';
import {MainHeaderOptions} from 'navigation/NavUtils';
import SwapView from 'screens/swap/SwapView';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useApplicationContext} from 'contexts/ApplicationContext';
import PortfolioStackScreen from 'navigation/wallet/PortfolioScreenStack';
import React from 'react';
import {noop} from 'rxjs';
import ActivityView from 'screens/activity/ActivityView';

const Tab = createBottomTabNavigator();

const PortfolioStackScreenWithProps = () => {
  return (
    <PortfolioStackScreen onExit={() => noop()} onSwitchWallet={() => noop()} />
  );
};

const TabNavigator = () => {
  const theme = useApplicationContext().theme;
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({focused}) => {
          switch (route.name) {
            case AppNavigation.Tabs.Portfolio:
              return <HomeSVG selected={focused} />;
            case AppNavigation.Tabs.Activity:
              return <ActivitySVG selected={focused} />;
            case AppNavigation.Tabs.Swap:
              return <SwapSVG selected={focused} />;
            case AppNavigation.Tabs.More:
              return <MoreSVG selected={focused} />;
            case AppNavigation.Tabs.Watchlist:
              return <WatchlistSVG selected={focused} />;
          }
        },
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: theme.accentColor,
        tabBarInactiveTintColor: theme.onBgSearch,
        tabBarStyle: {
          backgroundColor: theme.background,
        },
      })}>
      <Tab.Screen
        name={AppNavigation.Tabs.Portfolio}
        component={PortfolioStackScreenWithProps}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.Watchlist}
        component={WatchlistView}
      />
      <Tab.Screen
        name={AppNavigation.Tabs.Activity}
        options={{
          ...MainHeaderOptions('Activity'),
        }}
        component={ActivityView}
      />
      <Tab.Screen name={AppNavigation.Tabs.Swap} component={SwapView} />
    </Tab.Navigator>
  );
};

export default React.memo(TabNavigator);
