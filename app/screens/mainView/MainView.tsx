import React, {useContext, useEffect, useState} from 'react';
import {BackHandler, Image, Modal, StyleSheet, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, useFocusEffect} from '@react-navigation/native';
import PortfolioView from 'screens/portfolio/PortfolioView';
import SendView from 'screens/sendAvax/SendView';
import EarnView from 'screens/earn/EarnView';
import TransactionsView from 'screens/transactions/TransactionsView';
import Loader from 'components/Loader';
import AssetsView from 'screens/portfolio/AssetsView';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import {
  useWalletContext,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';

type Props = {
  onExit: () => void;
  onSwitchWallet: () => void;
};

const Tab = createBottomTabNavigator();

export default function MainView(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const walletStateContext = useWalletStateContext();
  const walletContext = useWalletContext();

  const theme = context.theme;
  const [wallet, setWallet] = useState<MnemonicWallet>();
  const [walletReady, setWalletReady] = useState<boolean>(false);
  const [isDarkMode] = useState(context.isDarkMode);

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
    if (walletContext?.wallet) {
      setWallet(walletContext?.wallet as MnemonicWallet);
    }
  }, [walletContext?.wallet]);

  useEffect(() => {
    if (!walletReady) {
      setWalletReady(walletStateContext?.balances !== undefined);
    }
  }, [walletStateContext]);

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
    <PortfolioView onSwitchWallet={onSwitchWallet} onExit={onExit} />
  );
  const Assets = () => <AssetsView wallet={wallet!} />;
  const Send = () => <SendView wallet={wallet!} />;
  const Earn = () => <EarnView wallet={wallet!} />;
  const Transactions = () => <TransactionsView wallet={wallet!} />;
  const Nav = () => (
    <NavigationContainer independent={true}>
      <Tab.Navigator
        sceneContainerStyle={styles.navContainer}
        screenOptions={props => screenOptions(props, isDarkMode)}
        tabBarOptions={{
          allowFontScaling: false,
          activeBackgroundColor: theme.bgApp,
          inactiveBackgroundColor: theme.bgApp,
          activeTintColor: theme.accentColor,
          inactiveTintColor: theme.bgOnBgApp,
        }}>
        <Tab.Screen name="Portfolio" component={Portfolio} />
        <Tab.Screen name="Assets" component={Assets} />
        <Tab.Screen name="Send" component={Send} />
        <Tab.Screen name="Earn" component={Earn} />
        <Tab.Screen name="Transactions" component={Transactions} />
      </Tab.Navigator>
    </NavigationContainer>
  );
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
  },
});
