import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {InteractionManager, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AccountView from 'screens/portfolio/account/AccountView';
import TabViewBackground from 'screens/portfolio/components/TabViewBackground';
import AvaxSheetHandle from 'components/AvaxSheetHandle';

function AccountBottomSheet(): JSX.Element {
  const navigation = useNavigation();
  const bottomSheetModalRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '45%'], []);

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
    <View style={{flex: 1}}>
      <BottomSheet
        backdropComponent={BottomSheetBackdrop}
        handleComponent={AvaxSheetHandle}
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backgroundComponent={TabViewBackground}>
        <AccountView />
      </BottomSheet>
    </View>
  );
}

export default AccountBottomSheet;
