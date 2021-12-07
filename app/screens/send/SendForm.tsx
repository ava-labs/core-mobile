import React, {FC, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import InputText from 'components/InputText';
import {bnAmountToString, stringAmountToBN} from 'dto/SendInfo';
import AvaText from 'components/AvaText';
import FlexSpacer from 'components/FlexSpacer';
import AvaButton from 'components/AvaButton';
import {ScrollView} from 'react-native-gesture-handler';
import {SendHookError} from '@avalabs/wallet-react-components';
import BN from 'bn.js';
import InfoSVG from 'components/svg/InfoSVG';
import {Space} from 'components/Space';

interface Props {
  error?: SendHookError;
  setAmount: (amount: BN) => void;
  setAddress: (address: string) => void;
  sendFee?: BN;
  gasLimit?: number;
  gasPrice?: BN;
  address?: string;
  canSubmit?: boolean;
  onNextPress?: () => void;
}

const SendForm: FC<Props> = ({
  error,
  setAmount,
  setAddress,
  sendFee,
  gasPrice,
  gasLimit,
  address,
  canSubmit,
  onNextPress,
}) => {
  const context = useApplicationContext();
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const gasInfo = (text: string) => (
    <AvaText.Body3 color={context.theme.background}>{text}</AvaText.Body3>
  );

  function fadeIn() {
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }

  function fadeOut() {
    Animated.timing(fadeAnimation, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }

  const helperText = (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
      <AvaText.Body2 textStyle={{textAlign: 'left'}}>$0</AvaText.Body2>
      <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
        <AvaText.Body3
          textStyle={{
            textAlign: 'right',
            color: context.theme.txtListItemSubscript,
          }}>
          {`Transaction fee: ${bnAmountToString(sendFee)}`}
        </AvaText.Body3>
        <Space x={8} />
        <AvaButton.Base onPress={fadeIn}>
          <InfoSVG />
        </AvaButton.Base>
      </View>
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={{flexGrow: 1}}
      keyboardShouldPersistTaps="handled">
      <View
        style={[
          context.backgroundStyle,
          {
            backgroundColor: undefined,
            paddingStart: 0,
            paddingEnd: 0,
            paddingBottom: 0,
          },
        ]}>
        <View style={[{paddingStart: 4, paddingEnd: 4, marginTop: 20}]}>
          <InputText
            label="Amount"
            placeholder="Enter the amount"
            helperText={helperText}
            errorText={
              error?.message?.startsWith('Amount') ? error?.message : undefined
            }
            keyboardType="numeric"
            onChangeText={text => {
              setAmount(stringAmountToBN(text));
            }}
          />
        </View>

        <View style={styles.horizontalLayout}>
          <View style={[{flex: 1, paddingStart: 4, paddingEnd: 4}]}>
            <InputText
              label={'Address'}
              placeholder="Enter the address"
              multiline={true}
              errorText={
                error?.message?.toLowerCase().indexOf('address') !== -1
                  ? error?.message
                  : undefined
              }
              onChangeText={text => {
                setAddress(text);
              }}
            />
            {address?.length === 0 && (
              <View />
              // <ScanQrIcon onScanBarcode={onScanBarcode} />
            )}
          </View>
        </View>
        <AnimatedPressable
          onPress={fadeOut}
          style={[
            styles.transactionFeeInfo,
            {
              backgroundColor: context.theme.alternateBackground,
              opacity: fadeAnimation,
            },
          ]}>
          <View style={styles.gasInfo}>
            {gasInfo('Gas Limit')}
            <Space x={8} />
            {gasInfo(`${gasLimit ?? 0}`)}
          </View>
          <Space y={8} />
          <View style={styles.gasInfo}>
            {gasInfo('Gas Price')}
            <Space x={8} />
            {gasInfo(`${bnAmountToString(gasPrice)}`)}
          </View>
        </AnimatedPressable>

        <FlexSpacer />

        <AvaButton.PrimaryLarge
          disabled={!canSubmit}
          style={{margin: 16}}
          onPress={onNextPress}>
          Next
        </AvaButton.PrimaryLarge>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  gasInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  horizontalLayout: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionFeeInfo: {
    padding: 16,
    borderRadius: 8,
    position: 'absolute',
    minWidth: 150,
    top: 140,
    right: 16,
  },
});

export default SendForm;
