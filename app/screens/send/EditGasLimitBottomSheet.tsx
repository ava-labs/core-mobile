import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {InteractionManager} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import TabViewBackground from 'screens/portfolio/components/TabViewBackground';
import AvaxSheetHandle from 'components/AvaxSheetHandle';
import EditFees from 'components/EditFees';
import {SendStackParamList} from 'navigation/wallet/SendScreenStack';
import {StackNavigationProp} from '@react-navigation/stack';

function EditGasLimitBottomSheet(): JSX.Element {
  const {goBack} = useNavigation<StackNavigationProp<SendStackParamList>>();
  const bottomSheetModalRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '90%'], []);
  const {params} = useRoute<RouteProp<SendStackParamList>>();

  const [editedGasLimit, setEditedGasLimit] = useState(params?.currentGasLimit);

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetModalRef?.current?.snapTo(1);
    }, 100);
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetModalRef?.current?.close();

    InteractionManager.runAfterInteractions(() => {
      goBack();
    });
  }, [editedGasLimit]);

  const handleChange = useCallback(index => {
    index === 0 && handleClose();
  }, []);

  const doSave = () => {
    params?.onSave?.(editedGasLimit);
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
        gasLimit={editedGasLimit}
        networkFee={params?.currentNetFee ?? ''}
        onSetGasLimit={value => setEditedGasLimit(value)}
      />
    </BottomSheet>
  );
}

export default EditGasLimitBottomSheet;
