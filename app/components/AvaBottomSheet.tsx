import React, {useCallback, useRef} from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import {useNavigation} from '@react-navigation/native';
import SendAvaxC from '../screens/sendAvax/SendAvaxC';
import {useWalletContext} from '@avalabs/wallet-react-components';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';

type Props = {
  children: React.ReactNode;
};
function AvaBottomSheet({children}: Props) {
  const navigation = useNavigation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const walletContext = useWalletContext();
  const handleSheetChange = useCallback(index => {
    // eslint-disable-next-line no-console
    console.log('handleSheetChange', index);
    if (index === 0) {
      navigation.goBack();
    }
  }, []);

  return (
    <BottomSheet
      index={1}
      ref={bottomSheetRef}
      snapPoints={['0%', '85%']}
      onChange={handleSheetChange}>
      {walletContext && (
        <SendAvaxC
          onClose={() => {}}
          wallet={walletContext.wallet as MnemonicWallet}
        />
      )}
    </BottomSheet>
  );
}

export default AvaBottomSheet;
