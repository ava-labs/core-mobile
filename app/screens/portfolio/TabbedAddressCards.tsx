import React, {useState} from 'react';
import {SceneMap, TabView} from 'react-native-tab-view';
import AddressCard from 'components/AddressCard';
import TabBarAva from 'components/TabBarAva';

type Props = {
  addressX: string;
  addressC: string;
  addressP: string;
};

export default function TabbedAddressCards(props: Props | Readonly<Props>) {
  const [index, setIndex] = useState(0);

  const xRoute = () => (
    <AddressCard title={'Derived Wallet Address'} address={props.addressX} />
  );

  const pRoute = () => (
    <AddressCard
      title={'Derived Platform Wallet Address'}
      address={props.addressP}
    />
  );

  const cRoute = () => (
    <AddressCard
      title={'Derived EVM Wallet Address'}
      address={props.addressC}
    />
  );

  const renderScene = SceneMap({
    X: xRoute,
    P: pRoute,
    C: cRoute,
  });

  const routes = [
    {key: 'X', title: 'X'},
    {key: 'P', title: 'P'},
    {key: 'C', title: 'C'},
  ];

  return (
    <TabView
      navigationState={{
        index: index,
        routes: routes,
      }}
      renderScene={renderScene}
      renderTabBar={TabBarAva}
      onIndexChange={index => setIndex(index)}
      style={[{height: 260}]}
    />
  );
}
