import React, {FC, useCallback, useEffect, useMemo, useRef} from 'react';
import {useNavigation} from '@react-navigation/native';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import TabViewBackground from 'screens/portfolio/components/TabViewBackground';
import {Space} from 'components/Space';
import ReceiveToken2 from 'screens/receive/ReceiveToken2';
import {Platform, Pressable, StyleSheet} from 'react-native';

const maxSnapPoint = Platform.OS === 'ios' ? '65%' : '70%';
const ReceiveOnlyBottomSheet: FC = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const {goBack, canGoBack} = useNavigation();

  const snapPoints = useMemo(() => ['0%', maxSnapPoint], []);

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetRef?.current?.snapTo(1);
    }, 50);
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetRef?.current?.collapse();
    // InteractionManager.runAfterInteractions(() => canGoBack() && goBack());
  }, []);

  const handleChange = useCallback(index => {
    if (index === 0 && canGoBack()) {
      goBack();
    }
  }, []);

  const MyHandle = () => {
    return <Space y={24} />;
  };

  // renders
  return (
    <>
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
        ]}
        onPress={handleClose}
      />
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        handleComponent={MyHandle}
        onChange={handleChange}
        backdropComponent={BottomSheetBackdrop}
        backgroundComponent={TabViewBackground}>
        <ReceiveToken2 />
      </BottomSheet>
    </>
  );
};

export default ReceiveOnlyBottomSheet;
