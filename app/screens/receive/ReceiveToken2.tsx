import React, {FC, memo, useContext} from 'react';
import {Share, StyleSheet, View} from 'react-native';
import ChainCard from './ChainCard';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaButton from 'components/AvaButton';
import CopySVG from 'components/svg/CopySVG';
import AvaText from 'components/AvaText';
import {Opacity05} from 'resources/Constants';
import {ShowSnackBar} from 'components/Snackbar';
import Clipboard from '@react-native-clipboard/clipboard';
import {Space} from 'components/Space';
import {
  createStackNavigator,
  StackNavigationProp,
  TransitionPresets,
} from '@react-navigation/stack';
import {NavigationContainer, useNavigation} from '@react-navigation/native';

type ReceiveStackParams = {
  ReceiveCChain: undefined;
  ReceiveXChain: undefined;
};

const ReceiveStack = createStackNavigator<ReceiveStackParams>();

function ReceiveToken2() {
  const {addressC, addressX} = usePortfolio();
  const theme = useContext(ApplicationContext).theme;

  const handleShare = async (address: string) => {
    try {
      const result = await Share.share({
        message: address,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('shared with activity type of ', result.activityType);
        } else {
          console.log('shared');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('dismissed');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <NavigationContainer independent={true}>
      <ReceiveStack.Navigator
        initialRouteName={'ReceiveCChain'}
        screenOptions={{
          presentation: 'card',
          headerBackTitleVisible: false,
          headerStyle: {
            backgroundColor: theme.colorBg2,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleAlign: 'center',
          headerTintColor: theme.colorText1,
          ...TransitionPresets.SlideFromRightIOS,
        }}>
        <ReceiveStack.Screen
          name={'ReceiveCChain'}
          options={{
            headerTitle: () => (
              <AvaText.Heading1>{'Receive Tokens'}</AvaText.Heading1>
            ),
            headerLeft: () => null,
          }}>
          {props => (
            <Receive
              {...props}
              selectedAddress={addressC}
              onShare={handleShare}
            />
          )}
        </ReceiveStack.Screen>
        <ReceiveStack.Screen
          name={'ReceiveXChain'}
          options={{
            headerTitle: () => <AvaText.Heading1>{'X Chain'}</AvaText.Heading1>,
          }}>
          {props => (
            <Receive
              {...props}
              selectedAddress={addressX}
              isXChain
              onShare={handleShare}
            />
          )}
        </ReceiveStack.Screen>
      </ReceiveStack.Navigator>
    </NavigationContainer>
  );
}

type ReceiveRouteProp = StackNavigationProp<ReceiveStackParams>;

const Receive: FC<{
  selectedAddress: string;
  isXChain?: boolean;
  onShare?: (address: string) => void;
}> = memo(props => {
  const theme = useContext(ApplicationContext).theme;
  const isXChain = !!props?.isXChain;
  const navigation = useNavigation<ReceiveRouteProp>();

  return (
    <View style={[styles.container, {backgroundColor: theme.colorBg2}]}>
      <AvaText.Body1>Scan QR code or share the address</AvaText.Body1>
      <View style={{alignSelf: 'center', marginTop: 16, marginBottom: 32}}>
        <ChainCard
          chainName={isXChain ? 'X Chain' : 'C Chain'}
          address={props.selectedAddress}
          hideBackground
          hideChainName
          removeMargins
        />
      </View>
      <AvaButton.Base
        onPress={() => {
          Clipboard.setString(props.selectedAddress);
          ShowSnackBar('Copied');
        }}
        style={[
          styles.copyAddressContainer,
          {backgroundColor: theme.colorIcon1 + Opacity05},
        ]}>
        <CopySVG />
        <AvaText.Body1
          ellipsize={'middle'}
          textStyle={{flex: 1, marginLeft: 16}}>
          {props.selectedAddress}
        </AvaText.Body1>
      </AvaButton.Base>
      <Space y={16} />
      <AvaButton.PrimaryLarge
        style={{marginHorizontal: 16, alignSelf: 'stretch'}}
        onPress={() => props?.onShare?.(props.selectedAddress)}>
        Share
      </AvaButton.PrimaryLarge>
      {isXChain || (
        <>
          <AvaButton.TextLarge
            style={{marginVertical: 16}}
            onPress={() => {
              navigation.navigate('ReceiveXChain');
            }}>
            Looking for X chain?
          </AvaButton.TextLarge>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  copyAddressContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
  },
});

export default ReceiveToken2;
