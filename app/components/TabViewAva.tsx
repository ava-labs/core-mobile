import React, {FC, useCallback, useEffect, useState} from 'react';
import {Route, TabBar, TabBarProps, TabView} from 'react-native-tab-view';
import {View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Props as TabBarItemProps} from 'react-native-tab-view/lib/typescript/TabBarItem';
import AvaButton from 'components/AvaButton';

interface Props {
  renderCustomLabel?: (title: string, selected: boolean) => void;
  currentTabIndex?: number;
  onTabIndexChange?: (tabIndex: number) => void;
}

const TabViewAva: FC<Props> = ({
  renderCustomLabel,
  currentTabIndex = 0,
  onTabIndexChange,
  children,
}) => {
  const [currentIndex, setCurrentIndex] = useState(currentTabIndex);
  const theme = useApplicationContext().theme;
  const childrenArray = React.Children.toArray(children);

  useEffect(() => {
    setCurrentIndex(currentTabIndex);
  }, [currentTabIndex]);

  // https://github.com/satya164/react-native-tab-view#tabview-props
  const routes = childrenArray.map((child, index) => {
    return {
      key: child?.props?.title,
      index: index,
      title: child?.props?.title,
    };
  });

  const scenes = useCallback(
    (sceneProps: any) => {
      return childrenArray[sceneProps.route.index];
    },
    [childrenArray],
  );

  const handleIndexChange = (index: number) => {
    setCurrentIndex(index);
    onTabIndexChange?.(index);
  };

  const tabBarItem = useCallback(
    (
      props: TabBarItemProps<Route> & {
        key: string;
      },
    ) => {
      return (
        <AvaButton.Base
          style={{
            flex: 1,
            paddingVertical: 6,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={props.onPress}>
          {props.renderLabel?.({
            route: props.route,
            focused: props.navigationState.index === props.route.index,
            color: 'white',
          })}
        </AvaButton.Base>
      );
    },
    [],
  );

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
          indicatorStyle={{
            backgroundColor: theme.alternateBackground,
            height: 2,
          }}
          renderTabBarItem={tabBarItem}
        />
      </View>
    );
  }, []);
  return (
    <TabView
      onIndexChange={handleIndexChange}
      navigationState={{index: currentIndex, routes}}
      renderScene={scenes}
      renderTabBar={tabbar}
    />
  );
};

export default TabViewAva;
