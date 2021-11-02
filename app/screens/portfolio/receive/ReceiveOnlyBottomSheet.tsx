import React, {FC, useCallback, useEffect, useMemo, useRef} from 'react';
import {useNavigation} from '@react-navigation/native';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import TabViewBackground from 'screens/portfolio/components/TabViewBackground';
import {Space} from 'components/Space';
import ReceiveToken2 from 'screens/receive/ReceiveToken2';
import {InteractionManager, Platform} from 'react-native';

const maxXChainSnapPoint = Platform.OS === 'ios' ? '57%' : '60%';

const ReceiveOnlyBottomSheet: FC = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const {goBack, canGoBack} = useNavigation();

  const snapPoints = useMemo(() => ['0%', maxXChainSnapPoint, '65%'], []);

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetRef?.current?.snapTo(2);
    }, 50);
  }, []);

  const handleChange = useCallback(index => {
    if (index === 0 && canGoBack()) {
      goBack();
    }
  }, []);

  const handlePositionChange = useCallback((position: number) => {
    InteractionManager.runAfterInteractions(() => {
      const snapPoint = position === 0 ? 2 : 1;
      bottomSheetRef?.current?.snapTo(snapPoint);
    });
  }, []);

  const MyHandle = () => {
    return <Space y={24} />;
  };

  // renders
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      handleComponent={MyHandle}
      onChange={handleChange}
      backdropComponent={BottomSheetBackdrop}
      backgroundComponent={TabViewBackground}>
      <ReceiveToken2 position={handlePositionChange} />
    </BottomSheet>
  );
};

export default ReceiveOnlyBottomSheet;
