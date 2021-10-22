import React, {FC, useCallback, useContext, useState} from 'react';
import {TabBar, TabBarProps, TabView} from 'react-native-tab-view';
import {View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface Props {
  renderCustomLabel?: (title: string, selected: boolean) => void;
}

const TabViewAva: FC<Props> = ({renderCustomLabel, children}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useContext(ApplicationContext).theme;
  const childrenArray = React.Children.toArray(children);

  // https://github.com/satya164/react-native-tab-view#tabview-props
  const routes = childrenArray.map((child, index) => {
    return {
      key: child?.props?.title,
      index: index,
      title: child?.props?.title,
    };
  });

  const scenes = useCallback((sceneProps: any) => {
    return childrenArray[sceneProps.route.index];
  }, []);

  const tabbar = useCallback((tabBarProps: TabBarProps) => {
    return (
      <View>
        <TabBar
          {...tabBarProps}
          style={{
            elevation: 0,
            shadowOpacity: 0,
            backgroundColor: theme.transparent,
            marginHorizontal: 16,
          }}
          renderLabel={({route, focused}) =>
            renderCustomLabel && renderCustomLabel(route?.title ?? '', focused)
          }
          indicatorStyle={{backgroundColor: theme.colorPrimary1, height: 2}}
          tabStyle={{width: 'auto', padding: 12}}
        />
      </View>
    );
  }, []);
  return (
    <TabView
      onIndexChange={setCurrentIndex}
      navigationState={{index: currentIndex, routes}}
      renderScene={scenes}
      renderTabBar={tabbar}
    />
  );
};

export default TabViewAva;
