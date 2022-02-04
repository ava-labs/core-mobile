import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {InteractionManager} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import TabViewBackground from 'screens/portfolio/components/TabViewBackground';
import AvaxSheetHandle from 'components/AvaxSheetHandle';
import {useSwapContext} from 'contexts/SwapContext';
import EditFees from 'components/EditFees';

function SwapFeesBottomSheet(): JSX.Element {
  const navigation = useNavigation();
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
      <EditFees
        onSave={doSave}
        gasLimit={trxDetails.gasLimit.toString()}
        networkFee={trxDetails.networkFee}
        onSetGasLimit={value => trxDetails.setUsersGasLimit(Number(value) || 0)}
      />
    </BottomSheet>
  );
}

export default SwapFeesBottomSheet;
