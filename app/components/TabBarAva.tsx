import React from 'react';
import {TabBar} from 'react-native-tab-view';
import {useApplicationContext} from 'contexts/ApplicationContext';

export default (props: any) => {
  const theme = useApplicationContext().theme;
  return (
    <TabBar
      {...props}
      indicatorStyle={{backgroundColor: theme.tabBarIconInactive}}
      style={{backgroundColor: theme.transparent}}
      labelStyle={{fontWeight: 'bold'}}
      activeColor={theme.accentColor}
      inactiveColor={theme.tabBarIconInactive}
    />
  );
};
