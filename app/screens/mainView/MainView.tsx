import React, {useContext, useEffect, useState} from 'react';
import {Alert, BackHandler, Image, Modal, StyleSheet, View} from 'react-native';
import MainViewViewModel from './MainViewViewModel';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, useFocusEffect} from '@react-navigation/native';
import PortfolioView from 'screens/portfolio/PortfolioView';
import SendView from 'screens/sendAvax/SendView';
import EarnView from 'screens/earn/EarnView';
import TransactionsView from 'screens/transactions/TransactionsView';
import Loader from 'components/Loader';
import {COLORS, COLORS_NIGHT} from 'resources/Constants';
import AssetsView from 'screens/portfolio/AssetsView';
import {Subscription} from 'rxjs';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  wallet: MnemonicWallet;
  onExit: () => void;
  onSwitchWallet: () => void;
};

const Tab = createBottomTabNavigator();

export default function MainView(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);

  const [viewModel] = useState(new MainViewViewModel(props.wallet));
  const [isDarkMode] = useState(context.isDarkMode);
  const [walletReady, setWalletReady] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        onExit();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  useEffect(() => {
    const disposables = new Subscription();
    disposables.add(
      viewModel.onResetHdIndices().subscribe({
        error: err => {
          Alert.alert('Error', err.message, [
            {text: 'Exit', onPress: () => onExit()},
          ]);
        },
        complete: () => setWalletReady(true),
      }),
    );

    return () => {
      disposables.unsubscribe();
    };
  }, []);

  const onExit = (): void => {
    props.onExit();
  };

  const onSwitchWallet = (): void => {
    props.onSwitchWallet();
  };

  const screenOptions = (params: any, isDarkMode: boolean): any => {
    return {
      tabBarIcon: () => {
        let icon;
        if (params.route.name === 'Portfolio') {
          icon = isDarkMode
            ? require('assets/icons/portfolio_dark.png')
            : require('assets/icons/portfolio_light.png');
        } else if (params.route.name === 'Assets') {
          icon = isDarkMode
            ? require('assets/icons/assets_dark.png')
            : require('assets/icons/assets_light.png');
        } else if (params.route.name === 'Send') {
          icon = isDarkMode
            ? require('assets/icons/send_dark.png')
            : require('assets/icons/send_light.png');
        } else if (params.route.name === 'Earn') {
          icon = isDarkMode
            ? require('assets/icons/earn_dark.png')
            : require('assets/icons/earn_light.png');
        } else if (params.route.name === 'Transactions') {
          icon = isDarkMode
            ? require('assets/icons/history_dark.png')
            : require('assets/icons/history_light.png');
        }

        return <Image source={icon} style={[{width: 24, height: 24}]} />;
      },
    };
  };
  const Portfolio = () => (
    <PortfolioView
      wallet={viewModel.wallet}
      onSwitchWallet={onSwitchWallet}
      onExit={onExit}
    />
  );
  const Assets = () => <AssetsView wallet={viewModel.wallet} />;
  const Send = () => <SendView wallet={viewModel.wallet.value} />;
  const Earn = () => <EarnView wallet={viewModel.wallet.value} />;
  const Transactions = () => (
    <TransactionsView wallet={viewModel.wallet.value} />
  );
  const Nav = () => (
    <NavigationContainer independent={true}>
      <Tab.Navigator
        sceneContainerStyle={styles.navContainer}
        screenOptions={props => screenOptions(props, isDarkMode)}
        tabBarOptions={{
          allowFontScaling: false,
          activeBackgroundColor: THEME.bg,
          inactiveBackgroundColor: THEME.bg,
          activeTintColor: THEME.primaryColor,
          inactiveTintColor: THEME.primaryColorLight,
        }}>
        <Tab.Screen name="Portfolio" component={Portfolio} />
        <Tab.Screen name="Assets" component={Assets} />
        <Tab.Screen name="Send" component={Send} />
        <Tab.Screen name="Earn" component={Earn} />
        <Tab.Screen name="Transactions" component={Transactions} />
      </Tab.Navigator>
    </NavigationContainer>
  );

  let THEME = isDarkMode ? COLORS_NIGHT : COLORS;
  return (
    <View style={styles.container}>
      <Modal animationType="fade" transparent={true} visible={!walletReady}>
        <Loader message={'Loading wallet'} />
      </Modal>

      <View style={styles.container}>{walletReady && Nav()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  navContainer: {
    backgroundColor: 'transparent',
    paddingStart: 16,
    paddingEnd: 16,
  },
});
