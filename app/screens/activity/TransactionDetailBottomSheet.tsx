import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import {InteractionManager, Pressable, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import TransactionDetailView from 'screens/activity/TransactionDetailView';

function AccountBottomSheet() {
  const {goBack} = useNavigation();
  const bottomSheetModalRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '55%'], []);

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetModalRef?.current?.snapTo(1);
    }, 100);
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetModalRef?.current?.close();
    InteractionManager.runAfterInteractions(() => goBack());
  }, []);

  const handleChange = useCallback(index => {
    // eslint-disable-next-line no-console
    console.log('handleSheetChange', index);
    index === 0 && handleClose();
  }, []);

  return (
    <>
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
        ]}
        onPress={goBack}
      />
      <BottomSheet
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleChange}>
        <TransactionDetailView />
      </BottomSheet>
    </>
  );
}
export default AccountBottomSheet;
