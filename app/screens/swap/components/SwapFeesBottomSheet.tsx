import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import BottomSheet, {BottomSheetBackdrop, BottomSheetScrollView} from '@gorhom/bottom-sheet';
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

function SwapFeesBottomSheet(): JSX.Element {
  const navigation = useNavigation();
  const {theme} = useApplicationContext();
  const bottomSheetModalRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '60%'], []);

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
    'Gas limit is the maximum units of gas you are willing to use.\n\nUnits of gas are a multiplier to “Max priority fee” and “Max fee.”',
    theme.colorBg3,
  );
  const priorityFeeInfoMessage = popableContent(
    'Max priority fee (aka “validator tip”) goes directly validators and incentivizes them to prioritize your transaction.\n\nYou will most often pay your max setting.',
    theme.colorBg3,
  );
  const maxFeeInfoMessage = popableContent(
    'The max fee is the most you will pay (base fee + priority fee).',
    theme.colorBg3,
  );

  return (
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      backgroundComponent={TabViewBackground}
      onChange={handleChange}>
      <>
        <BottomSheetScrollView>
          <AvaText.LargeTitleBold textStyle={{marginHorizontal: 12}}>
            Edit Fees
          </AvaText.LargeTitleBold>
          <Space y={24} />
          <Text style={{marginHorizontal: 12}}>
            <AvaText.Heading1>0.102320</AvaText.Heading1>
            <AvaText.Heading3>AVAX</AvaText.Heading3>
          </Text>
          <AvaText.Body3 textStyle={{marginHorizontal: 12}}>
            Max fee: (0.005935 AVAX)
          </AvaText.Body3>
          <InputText
            label={'Gas Limit ⓘ'}
            popOverInfoText={gasLimitInfoInfoMessage}
            placeholder={'Gas Limit'}
          />
          <InputText
            label={'Max priority fee (GWEI) ⓘ'}
            popOverInfoText={priorityFeeInfoMessage}
            placeholder={'GWEI'}
          />
          <InputText
            label={'Max fee ⓘ'}
            popOverInfoText={maxFeeInfoMessage}
            placeholder={'GWEI'}
          />
          <AvaButton.PrimaryLarge style={{marginHorizontal: 12}}>
            Save
          </AvaButton.PrimaryLarge>
        </BottomSheetScrollView>
      </>
    </BottomSheet>
  );
}

export default SwapFeesBottomSheet;
