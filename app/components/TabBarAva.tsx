import React, {useContext} from 'react';
import {TabBar} from 'react-native-tab-view';
import {ApplicationContext} from 'contexts/ApplicationContext';

export default (props: any) => {
  const theme = useContext(ApplicationContext).theme;
  return (
    <TabBar
      {...props}
      indicatorStyle={{backgroundColor: theme.tabBarIndicator}}
      style={{backgroundColor: theme.transparent}}
      labelStyle={{fontWeight: 'bold'}}
      activeColor={theme.tabBarText}
      inactiveColor={theme.primaryColorLight}
    />
  );
};
