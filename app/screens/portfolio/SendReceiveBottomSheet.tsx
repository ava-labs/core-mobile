import React, {useCallback, useMemo, useRef} from 'react';
import SendAvaxC from 'screens/sendAvax/SendAvaxC';
import {useWalletContext} from '@avalabs/wallet-react-components';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import BottomSheet from '@gorhom/bottom-sheet';
import {InteractionManager} from 'react-native';
import {useNavigation} from '@react-navigation/native';

function SendReceiveBottomSheet() {
  const wallet = useWalletContext()?.wallet as MnemonicWallet;
  const navigation = useNavigation();
  const bottomSheetModalRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '75%'], []);

  const handleClose = useCallback(() => {
    bottomSheetModalRef?.current?.close();
    InteractionManager.runAfterInteractions(() => navigation.goBack());
  }, []);

  return (
    <BottomSheet ref={bottomSheetModalRef} index={1} snapPoints={snapPoints}>
      <SendAvaxC wallet={wallet} onClose={handleClose} />
    </BottomSheet>
  );
}

export default SendReceiveBottomSheet;
