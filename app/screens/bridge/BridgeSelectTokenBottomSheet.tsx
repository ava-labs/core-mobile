import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {InteractionManager} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import TabViewBackground from 'screens/portfolio/components/TabViewBackground';
import AvaxSheetHandle from 'components/AvaxSheetHandle';
import AvaText from 'components/AvaText';
import BridgeTokenSelector, {
  SelectTokenMode,
} from 'screens/bridge/BridgeTokenSelector';

function BridgeSelectTokenBottomSheet(): JSX.Element {
  const navigation = useNavigation();
  const bottomSheetModalRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '90%'], []);
  const route = useRoute();

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetModalRef?.current?.snapTo(1);
    }, 100);
  }, []);

  function onTokenSelected(symbol: string) {
    handleClose();
    route.params.onTokenSelected(symbol);
  }

  const handleClose = useCallback(() => {
    bottomSheetModalRef?.current?.close();
    InteractionManager.runAfterInteractions(() => navigation.goBack());
  }, []);

  const handleChange = useCallback(index => {
    index === 0 && handleClose();
  }, []);

  return (
    <BottomSheet
      backdropComponent={BottomSheetBackdrop}
      handleComponent={AvaxSheetHandle}
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      backgroundComponent={TabViewBackground}
      onChange={handleChange}>
      <>
        <AvaText.LargeTitleBold textStyle={{marginHorizontal: 16}}>
          Select Token
        </AvaText.LargeTitleBold>
        <BridgeTokenSelector
          onTokenSelected={onTokenSelected}
          selectMode={SelectTokenMode.CONVERT}
        />
      </>
    </BottomSheet>
  );
}

export default BridgeSelectTokenBottomSheet;
