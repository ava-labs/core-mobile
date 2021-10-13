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
import AvaListItem from 'components/AvaListItem';
import ClearSVG from 'components/svg/ClearSVG';
import TabViewAva from 'components/TabViewAva';
import ReceiveToken from 'screens/receive/ReceiveToken';
import ActivityView from 'screens/activity/ActivityView';
import AvaButton from 'components/AvaButton';
import {SendAvaxContextProvider} from 'contexts/SendAvaxContext';
import {SelectedTokenContext, TokenType} from 'contexts/SelectedTokenContext';
import {
  ERC20,
  ERC20WithBalance,
  TokenWithBalance,
} from '@avalabs/wallet-react-components';
import {SendERC20ContextProvider} from 'contexts/SendERC20Context';
import SendERC20 from 'screens/sendERC20/SendERC20';
import SendERC20Confirm from 'screens/sendERC20/SendERC20Confirm';

const Stack = createStackNavigator();

type Props = {
  onClose: () => void;
};

const SendTokenStackScreen = ({onClose}: Props) => {
  const theme = useContext(ApplicationContext).theme;
  const {selectedToken, tokenLogo, tokenType} =
    useContext(SelectedTokenContext);
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
    const {navigate} = useNavigation();
    return {
      [TokenType.AVAX]: (
        <SendAvaxConfirm
          onConfirm={() =>
            navigate(AppNavigation.SendToken.ConfirmTransactionScreen)
          }
          onClose={onClose}
        />
      ),
      [TokenType.ERC20]: (
        <SendERC20Confirm
          onConfirm={() =>
            navigate(AppNavigation.SendToken.ConfirmTransactionScreen)
          }
          onClose={onClose}
        />
      ),
      [TokenType.ANT]: <SendAvax />,
    }[tokenType(selectedToken) ?? TokenType.AVAX];
  };

  const noHeaderOptions = useMemo(
    () => ({headerShown: false, headerLeft: () => null}),
    [],
  );

  const header = (token: TokenWithBalance | undefined) => {
    return (
      <View
        style={{
          flexDirection: 'row',
        }}>
        <View style={{flex: 1}}>
          <AvaListItem.Base
            label={<AvaText.Heading3>{token?.name}</AvaText.Heading3>}
            title={
              <AvaText.Heading1>{`${token?.balanceDisplayValue} ${token?.symbol}`}</AvaText.Heading1>
            }
            subtitle={
              <AvaText.Body2>
                ${token?.balanceUsdDisplayValue} USD
              </AvaText.Body2>
            }
            leftComponent={tokenLogo()}
            titleAlignment={'flex-start'}
          />
        </View>
        <AvaButton.Icon onPress={onClose} style={{marginTop: -16}}>
          <ClearSVG
            color={theme.colorIcon1}
            backgroundColor={theme.colorBg2}
            size={40}
          />
        </AvaButton.Icon>
      </View>
    );
  };

  const SendTab = ({token}: {token: TokenWithBalance | undefined}) => {
    return {
      [TokenType.AVAX]: <SendAvax />,
      [TokenType.ERC20]: <SendERC20 />,
      [TokenType.ANT]: <SendAvax />,
    }[tokenType(token) ?? TokenType.AVAX];
  };

  const HeaderAndTabs = () => (
    <>
      {header(selectedToken)}
      <TabViewAva renderCustomLabel={renderCustomLabel}>
        <SendTab title={'Send'} token={selectedToken} />
        <ReceiveToken title={'Receive'} />
        <ActivityView embedded title={'Activity'} />
      </TabViewAva>
    </>
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
    [TokenType.ANT]: <SendAvaxStack />, //fixme: implement send ant
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
