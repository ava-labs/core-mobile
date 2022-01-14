import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {InteractionManager, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import TabViewBackground from 'screens/portfolio/components/TabViewBackground';
import AvaxSheetHandle from 'components/AvaxSheetHandle';
import AvaText from 'components/AvaText';
import InputText from 'components/InputText';
import AvaButton from 'components/AvaButton';
import {Space} from 'components/Space';
import {popableContent} from 'screens/swap/components/SwapTransactionDetails';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {useSwapContext} from 'contexts/SwapContext';
import {ScrollView} from 'react-native-gesture-handler';

function SwapFeesBottomSheet(): JSX.Element {
  const navigation = useNavigation();
  const {theme} = useApplicationContext();
  const bottomSheetModalRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '60%'], []);
  const {trxDetails} = useSwapContext();

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetModalRef?.current?.snapTo(1);
    }, 100);
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetModalRef?.current?.close();
    InteractionManager.runAfterInteractions(() => navigation.goBack());
  }, []);

  const handleChange = useCallback(index => {
    index === 0 && handleClose();
  }, []);

  const gasLimitInfoInfoMessage = popableContent(
    'Gas limit is the maximum units of gas you are willing to use.”',
    theme.colorBg3,
  );
  const gasFeeInfoMessage = popableContent(
    'Gas fee is the price of gas unit.',
    theme.colorBg3,
  );

  const doSave = () => {
    handleClose();
  };

  return (
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      backgroundComponent={TabViewBackground}
      onChange={handleChange}>
      <ScrollView>
        <AvaText.LargeTitleBold textStyle={{marginHorizontal: 12}}>
          Edit Fees
        </AvaText.LargeTitleBold>
        <Space y={24} />
        <Text style={{marginHorizontal: 12}}>
          <AvaText.Heading1>{trxDetails.networkFee}</AvaText.Heading1>
        </Text>
        <AvaText.Body3 textStyle={{marginHorizontal: 12}}>
          Max fee: ({trxDetails.networkFee})
        </AvaText.Body3>
        <InputText
          label={'Gas Limit ⓘ'}
          mode={'amount'}
          text={trxDetails.gasLimit.toString()}
          popOverInfoText={gasLimitInfoInfoMessage}
          onChangeText={text => trxDetails.setUsersGasLimit(Number(text) || 0)}
        />
        <InputText
          label={'Gas Price ⓘ'}
          text={trxDetails.gasPriceNAvax.toString()}
          currency={'nAVAX'}
          mode={'currency'}
          popOverInfoText={gasFeeInfoMessage}
          onChangeText={text =>
            trxDetails.setUsersGasPriceNAvax(Number(text) || 0)
          }
        />
        <Space y={24} />
        <AvaButton.PrimaryLarge style={{marginHorizontal: 12}} onPress={doSave}>
          Save
        </AvaButton.PrimaryLarge>
      </ScrollView>
    </BottomSheet>
  );
}

export default SwapFeesBottomSheet;
