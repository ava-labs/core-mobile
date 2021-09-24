import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import {Button, InteractionManager, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AvaText from 'components/AvaText';

function AccountBottomSheet() {
  const navigation = useNavigation();
  const bottomSheetModalRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '75%'], []);

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
    // eslint-disable-next-line no-console
    console.log('handleSheetChange', index);
    index === 0 && handleClose();
  }, []);

  return (
    <BottomSheet
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleChange}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'white',
          alignItems: 'center',
          padding: 16,
        }}>
        <AvaText.Heading1>Transaction Details</AvaText.Heading1>
        <AvaText.Body2 textStyle={{paddingTop: 8, paddingBottom: 32}}>Sep 10, 2021 09:00 am  -  Bal: $89.700,01
        </AvaText.Body2>

      </View>
    </BottomSheet>
  );
}

export default AccountBottomSheet;
