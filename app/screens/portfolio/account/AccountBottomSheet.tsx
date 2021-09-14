import React, {useCallback, useMemo, useRef} from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import {Button, InteractionManager, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';

function AccountBottomSheet() {
  const navigation = useNavigation();
  const bottomSheetModalRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '75%'], []);

  const handleClose = useCallback(() => {
    bottomSheetModalRef?.current?.close();
    InteractionManager.runAfterInteractions(() => navigation.goBack());
  }, []);

  return (
    <BottomSheet ref={bottomSheetModalRef} index={1} snapPoints={snapPoints}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'yellow',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Button title={'close'} onPress={handleClose} />
      </View>
    </BottomSheet>
  );
}

export default AccountBottomSheet;
