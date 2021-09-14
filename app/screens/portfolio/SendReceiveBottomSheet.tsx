import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SendAvaxC from 'screens/sendAvax/SendAvaxC';
import {useWalletContext} from '@avalabs/wallet-react-components';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import BottomSheet from '@gorhom/bottom-sheet';
import {InteractionManager} from 'react-native';
import {useNavigation} from '@react-navigation/native';

function SendReceiveBottomSheet() {
  const [index, setIndex] = useState(0);
  const wallet = useWalletContext()?.wallet as MnemonicWallet;
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
      index={index}
      snapPoints={snapPoints}
      onChange={handleChange}>
      <SendAvaxC wallet={wallet} onClose={handleClose} />
    </BottomSheet>
  );
}

export default SendReceiveBottomSheet;
