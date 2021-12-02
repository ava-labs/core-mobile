import React, {FC, memo, useCallback} from 'react';
import {Share, StyleSheet, View} from 'react-native';
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
import {MainHeaderOptions, SubHeaderOptions} from 'navigation/NavUtils';

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
        headerTitleAlign: 'center',
        ...TransitionPresets.SlideFromRightIOS,
      }}>
      <ReceiveStack.Screen
        name={'ReceiveCChain'}
        options={MainHeaderOptions('Receive tokens', !showBackButton)}>
        {props => (
          <Receive
            {...props}
            selectedAddress={addressC}
            onShare={handleShare}
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
            onShare={handleShare}
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
    <View style={[styles.container]}>
      <AvaText.Body2>
        This is your C chain address to receive funds. Your address will change
        after every deposit.
      </AvaText.Body2>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    alignSelf: 'baseline',
  },
});

export default ReceiveToken2;
