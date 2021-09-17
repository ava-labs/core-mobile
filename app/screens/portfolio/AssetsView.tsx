import React, {useContext, useState} from 'react';
import {FlatList, Modal, StyleSheet, View} from 'react-native';
import Header from 'screens/mainView/Header';
import TextTitle from 'components/TextTitle';
import {SceneMap, TabView} from 'react-native-tab-view';
import AssetsItem from './AssetsItem';
import TabBarAva from 'components/TabBarAva';
import ButtonAva from 'components/ButtonAva';
import AssetsAddToken from './AssetsAddToken';
import {TokenItem, useTokenAssets} from 'screens/portfolio/AssetsTokenHook';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {useWalletContext} from '@avalabs/wallet-react-components/lib/index.es';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';

export default function AssetsView() {
  const context = useContext(ApplicationContext);
  const walletContext = useWalletContext();
  const [addTokenVisible, setAddTokenVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [tokenItems] = useTokenAssets(walletContext?.wallet as MnemonicWallet);

  const renderItem = (item: TokenItem) => (
    <AssetsItem title={item.title} balance={item.balance} />
  );

  const tokensRoute = () => (
    <FlatList
      data={tokenItems}
      renderItem={info => renderItem(info.item)}
      keyExtractor={item => item.id}
    />
  );

  const collectiblesRoute = () => <TextTitle text={'Collectibles'} />;

  const renderScene = SceneMap({
    Tokens: tokensRoute,
    Collectibles: collectiblesRoute,
  });

  const routes = [
    {key: 'Tokens', title: 'Tokens'},
    {key: 'Collectibles', title: 'Collectibles'},
  ];

  return (
    <View style={[styles.container, {backgroundColor: context.theme.bgApp}]}>
      <Header />
      <TabView
        navigationState={{
          index: index,
          routes: routes,
        }}
        renderScene={renderScene}
        renderTabBar={TabBarAva}
        onIndexChange={index => setIndex(index)}
      />
      <ButtonAva text={'Add token'} onPress={() => setAddTokenVisible(true)} />

      <Modal
        animationType="slide"
        transparent={true}
        visible={addTokenVisible}
        onRequestClose={() => setAddTokenVisible(false)}>
        <AssetsAddToken
          onClose={() => {
            setAddTokenVisible(false);
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
});
