import React, {FC, memo, useCallback, useContext} from 'react';
import {Share, StyleSheet, View} from 'react-native';
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
import {
  NavigationContainer,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import AvaxQACode from 'components/AvaxQACode';
import {SubHeaderOptions} from 'App';

type ReceiveStackParams = {
  ReceiveCChain: undefined;
  ReceiveXChain: undefined;
};

const ReceiveStack = createStackNavigator<ReceiveStackParams>();

function ReceiveToken2({position}: {position: (position: number) => void}) {
  const {addressC, addressX} = usePortfolio();
  const {navContainerTheme} = useContext(ApplicationContext);

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
    <NavigationContainer independent={true} theme={navContainerTheme}>
      <ReceiveStack.Navigator
        initialRouteName={'ReceiveCChain'}
        screenOptions={{
          presentation: 'card',
          headerBackTitleVisible: false,
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleAlign: 'center',
          ...TransitionPresets.SlideFromRightIOS,
        }}>
        <ReceiveStack.Screen
          name={'ReceiveCChain'}
          options={SubHeaderOptions('Receive tokens', true)}>
          {props => (
            <Receive
              {...props}
              selectedAddress={addressC}
              onShare={handleShare}
              positionCallback={position}
            />
          )}
        </ReceiveStack.Screen>
        <ReceiveStack.Screen
          name={'ReceiveXChain'}
          options={SubHeaderOptions('X Chain')}>
          {props => (
            <Receive
              {...props}
              selectedAddress={addressX}
              isXChain
              onShare={handleShare}
              positionCallback={position}
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
  positionCallback?: (position: number) => void;
}> = memo(props => {
  const theme = useContext(ApplicationContext).theme;
  const isXChain = !!props?.isXChain;
  const navigation = useNavigation<ReceiveRouteProp>();

  useFocusEffect(
    useCallback(() => {
      props?.positionCallback?.(isXChain ? 1 : 0);
    }, []),
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.colorBg2}]}>
      <AvaText.Body1>Scan QR code or share the address</AvaText.Body1>
      <View style={{alignSelf: 'center', marginTop: 16, marginBottom: 32}}>
        <AvaxQACode
          circularText={isXChain ? 'X Chain' : 'C Chain'}
          address={props.selectedAddress}
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
        <AvaText.Body1
          ellipsize={'middle'}
          textStyle={{flex: 1, marginRight: 16}}>
          {props.selectedAddress}
        </AvaText.Body1>
        <CopySVG />
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
