import React, {FC, useCallback, useEffect, useMemo, useRef} from 'react';
import {useNavigation} from '@react-navigation/native';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import TabViewBackground from './components/TabViewBackground';
import SendTokenScreenStack from 'navigation/wallet/SendTokenScreenStack';
import {Space} from 'components/Space';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Platform} from 'react-native';

const SendReceiveBottomSheet: FC = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const {goBack, canGoBack} = useNavigation();
  const snapPoints = useMemo(() => ['0%', '85%'], []);
  const {setKeyboardAvoidingViewEnabled} = useApplicationContext();

  useEffect(() => {
    if (Platform.OS === 'ios') {
      setKeyboardAvoidingViewEnabled(false);
      return () => setKeyboardAvoidingViewEnabled(true);
    }
  }, []);

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
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      handleComponent={MyHandle}
      onChange={handleChange}
      backdropComponent={BottomSheetBackdrop}
      backgroundComponent={TabViewBackground}>
      <SendTokenScreenStack onClose={handleClose} />
    </BottomSheet>
  );
};

export default SendReceiveBottomSheet;
