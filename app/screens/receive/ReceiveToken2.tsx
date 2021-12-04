import React, {FC, memo, useCallback} from 'react';
import {StyleSheet, View} from 'react-native';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import {useApplicationContext} from 'contexts/ApplicationContext';
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
import {SubHeaderOptions} from 'navigation/NavUtils';
import HeaderAccountSelector from 'components/HeaderAccountSelector';

type ReceiveStackParams = {
  ReceiveCChain: undefined;
  ReceiveXChain: undefined;
};

const ReceiveStack = createStackNavigator<ReceiveStackParams>();

interface Props {
  showBackButton?: boolean;
  setPosition?: (position: number) => void;
}

function ReceiveToken2({setPosition, showBackButton = false}: Props) {
  const {addressC, addressX} = usePortfolio();
  const {navContainerTheme} = useApplicationContext();

  //Share has been decommissioned yet again :(
  // const handleShare = async (address: string) => {
  //   try {
  //     const result = await Share.share({
  //       message: address,
  //     });
  //     if (result.action === Share.sharedAction) {
  //       if (result.activityType) {
  //         console.log('shared with activity type of ', result.activityType);
  //       } else {
  //         console.log('shared');
  //       }
  //     } else if (result.action === Share.dismissedAction) {
  //       console.log('dismissed');
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const receiveNavigator = (
    <ReceiveStack.Navigator
      initialRouteName={'ReceiveCChain'}
      screenOptions={{
        presentation: 'card',
        headerBackTitleVisible: false,
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
        },
        ...TransitionPresets.SlideFromRightIOS,
      }}>
      <ReceiveStack.Screen
        name={'ReceiveCChain'}
        options={{
          headerTitle: () => <HeaderAccountSelector />,
        }}>
        {props => (
          <Receive
            {...props}
            selectedAddress={addressC}
            positionCallback={setPosition}
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
            positionCallback={setPosition}
          />
        )}
      </ReceiveStack.Screen>
    </ReceiveStack.Navigator>
  );

  if (showBackButton) {
    return receiveNavigator;
  } else {
    return (
      <NavigationContainer
        independent={!showBackButton}
        theme={navContainerTheme}>
        {receiveNavigator}
      </NavigationContainer>
    );
  }
}

type ReceiveRouteProp = StackNavigationProp<ReceiveStackParams>;

const Receive: FC<{
  selectedAddress: string;
  isXChain?: boolean;
  onShare?: (address: string) => void;
  positionCallback?: (position: number) => void;
}> = memo(props => {
  const theme = useApplicationContext().theme;
  const isXChain = !!props?.isXChain;
  const navigation = useNavigation<ReceiveRouteProp>();

  useFocusEffect(
    useCallback(() => {
      props?.positionCallback?.(isXChain ? 1 : 0);
    }, []),
  );

  return (
    <View style={{flex: 1}}>
      <Space y={8} />
      <AvaText.Heading1 textStyle={{marginHorizontal: 8}}>
        Receive Tokens
      </AvaText.Heading1>
      <Space y={24} />
      <AvaText.Body2 textStyle={{marginHorizontal: 8}}>
        This is your C chain address to receive funds. Your address will change
        after every deposit.
      </AvaText.Body2>
      <View style={[styles.container]}>
        <Space y={40} />
        <View style={{alignSelf: 'center'}}>
          <AvaxQACode
            circularText={isXChain ? 'X Chain' : 'C Chain'}
            address={props.selectedAddress}
          />
        </View>
        <Space y={32} />
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
          <CopySVG color={theme.colorText1} />
        </AvaButton.Base>
        <Space y={16} />
        {isXChain || (
          <>
            <Space y={130} />
            <AvaButton.TextLarge
              style={{marginVertical: 16}}
              onPress={() => {
                navigation.navigate('ReceiveXChain');
              }}>
              Looking for X-Chain?
            </AvaButton.TextLarge>
          </>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  copyAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    alignSelf: 'baseline',
  },
});

export default ReceiveToken2;
