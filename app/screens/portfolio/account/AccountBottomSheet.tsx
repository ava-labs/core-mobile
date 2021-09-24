import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import {
  InteractionManager,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AccountView from 'screens/portfolio/account/AccountView';
import TabViewBackground from 'screens/portfolio/components/TabViewBackground';

function AccountBottomSheet(): JSX.Element {
  const navigation = useNavigation();
  const bottomSheetModalRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '65%'], []);

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
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
        ]}
        onPress={() => navigation.goBack()}
      />
      <BottomSheet
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
