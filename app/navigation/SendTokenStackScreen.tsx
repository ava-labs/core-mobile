import React, {useContext, useMemo} from 'react';
import {
  createStackNavigator,
  StackNavigationOptions,
  TransitionPresets,
} from '@react-navigation/stack';
import {TouchableOpacity} from '@gorhom/bottom-sheet';
import CarrotSVG from 'components/svg/CarrotSVG';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import SendAvaxConfirm from 'screens/sendAvax/SendAvaxConfirm';
import {ApplicationContext} from 'contexts/ApplicationContext';
import SendAvax from 'screens/sendAvax/SendAvax';
import {View} from 'react-native';
import {Space} from 'components/Space';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaText from 'components/AvaText';
import AppNavigation from 'navigation/AppNavigation';
import TabViewAva from 'components/TabViewAva';
import ReceiveToken from 'screens/receive/ReceiveToken';
import AvaButton from 'components/AvaButton';
import {SendAvaxContextProvider} from 'contexts/SendAvaxContext';
import {SelectedTokenContext, TokenType} from 'contexts/SelectedTokenContext';
import {
  AntWithBalance,
  ERC20,
  ERC20WithBalance,
  TokenWithBalance,
} from '@avalabs/wallet-react-components';
import {SendERC20ContextProvider} from 'contexts/SendERC20Context';
import SendERC20 from 'screens/sendERC20/SendERC20';
import SendERC20Confirm from 'screens/sendERC20/SendERC20Confirm';
import SendHeader from 'screens/portfolio/sendBottomSheet/SendHeader';
import SendANT from 'screens/sendANT/SendANT';
import {SendANTContextProvider} from 'contexts/SendANTContext';
import SendANTConfirm from 'screens/sendANT/SendANTConfirm';

const Stack = createStackNavigator();

type Props = {
  onClose: () => void;
};

const SendTokenStackScreen = ({onClose}: Props) => {
  const theme = useContext(ApplicationContext).theme;
  const {selectedToken, tokenType} = useContext(SelectedTokenContext);
  const screenOptions = useMemo<StackNavigationOptions>(
    () => ({
      ...TransitionPresets.SlideFromRightIOS,
      headerShown: true,
      safeAreaInsets: {top: 0},
      headerLeft: ({onPress}) => (
        <TouchableOpacity
          style={{paddingEnd: 16, transform: [{rotate: '180deg'}]}}
          onPress={onPress}>
          <CarrotSVG color={theme.colorText1} />
        </TouchableOpacity>
      ),
      headerTitleStyle: {
        color: theme.colorText1,
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        lineHeight: 29,
      },
      headerStyle: {
        backgroundColor: theme.bgOnBgApp,
        shadowColor: theme.transparent,
      },
      cardStyle: {
        backgroundColor: theme.bgOnBgApp,
        overflow: 'visible',
      },
    }),
    [],
  );

  const DoneDoneScreen = () => <DoneScreen onClose={onClose} />;
  const ConfirmScreen = () => {
    return {
      [TokenType.AVAX]: <SendAvaxConfirm />,
      [TokenType.ERC20]: <SendERC20Confirm />,
      [TokenType.ANT]: <SendANTConfirm />,
    }[tokenType(selectedToken) ?? TokenType.AVAX];
  };

  const noHeaderOptions = useMemo(
    () => ({headerShown: false, headerLeft: () => null}),
    [],
  );

  const SendTab = ({token}: {token: TokenWithBalance | undefined}) => {
    return {
      [TokenType.AVAX]: <SendAvax />,
      [TokenType.ERC20]: <SendERC20 />,
      [TokenType.ANT]: <SendANT />,
    }[tokenType(token) ?? TokenType.AVAX];
  };

  const HeaderAndTabs = () => (
    <View style={{flex: 1}}>
      <SendHeader onClose={onClose} />
      <TabViewAva renderCustomLabel={renderCustomLabel}>
        <SendTab title={'Send'} token={selectedToken} />
        <ReceiveToken title={'Receive'} />
        {/*<ActivityView embedded title={'Activity'} />*/}
      </TabViewAva>
    </View>
  );

  const renderCustomLabel = (title: string, focused: boolean) => {
    return (
      <AvaText.Heading3
        textStyle={{color: focused ? theme.colorText1 : theme.colorText2}}>
        {title}
      </AvaText.Heading3>
    );
  };

  const SendAvaxStack = () => {
    return (
      <SendAvaxContextProvider>
        <NavigationContainer independent={true}>
          <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen
              name={AppNavigation.SendToken.SendTokenScreen}
              options={noHeaderOptions}
              component={HeaderAndTabs}
            />
            <Stack.Screen
              options={{title: 'Confirm Transaction'}}
              name={AppNavigation.SendToken.ConfirmTransactionScreen}
              component={ConfirmScreen}
            />
            <Stack.Screen
              name={AppNavigation.SendToken.DoneScreen}
              options={noHeaderOptions}
              component={DoneDoneScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SendAvaxContextProvider>
    );
  };

  const SendANTStack = ({token}: {token: AntWithBalance}) => {
    return (
      <SendANTContextProvider antToken={token}>
        <NavigationContainer independent={true}>
          <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen
              name={AppNavigation.SendToken.SendTokenScreen}
              options={noHeaderOptions}
              component={HeaderAndTabs}
            />
            <Stack.Screen
              options={{title: 'Confirm Transaction'}}
              name={AppNavigation.SendToken.ConfirmTransactionScreen}
              component={ConfirmScreen}
            />
            <Stack.Screen
              name={AppNavigation.SendToken.DoneScreen}
              options={noHeaderOptions}
              component={DoneDoneScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SendANTContextProvider>
    );
  };

  const SendERC20Stack = ({token}: {token: ERC20}) => {
    return (
      <SendERC20ContextProvider erc20Token={token}>
        <NavigationContainer independent={true}>
          <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen
              name={AppNavigation.SendToken.SendTokenScreen}
              options={noHeaderOptions}
              component={HeaderAndTabs}
            />
            <Stack.Screen
              options={{title: 'Confirm Transaction'}}
              name={AppNavigation.SendToken.ConfirmTransactionScreen}
              component={ConfirmScreen} //TODO: change to specific screen for ant
            />
            <Stack.Screen
              name={AppNavigation.SendToken.DoneScreen}
              options={noHeaderOptions}
              component={DoneDoneScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SendERC20ContextProvider>
    );
  };

  return {
    [TokenType.AVAX]: <SendAvaxStack />,
    [TokenType.ERC20]: (
      <SendERC20Stack token={selectedToken as ERC20WithBalance} />
    ),
    [TokenType.ANT]: <SendANTStack token={selectedToken as AntWithBalance} />,
  }[tokenType(selectedToken) ?? TokenType.AVAX];
};

interface DoneProps {
  onClose: () => void;
}

function DoneScreen({onClose}: DoneProps) {
  const context = useContext(ApplicationContext);
  return (
    <View
      style={[
        useContext(ApplicationContext).backgroundStyle,
        {
          backgroundColor: undefined,
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          paddingStart: 0,
          paddingEnd: 0,
        },
      ]}>
      <Space y={100} />
      <AvaLogoSVG
        logoColor={context.theme.white}
        backgroundColor={context.theme.logoColor}
      />
      <Space y={32} />
      <AvaText.Heading2>Asset sent</AvaText.Heading2>
      <View style={{flex: 1}} />
      <View style={{width: '100%'}}>
        <AvaButton.PrimaryLarge style={{margin: 16}} onPress={onClose}>
          Done
        </AvaButton.PrimaryLarge>
      </View>
    </View>
  );
}

export default SendTokenStackScreen;
