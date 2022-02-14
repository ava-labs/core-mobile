import React, {FC, useEffect, useMemo, useState} from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import InputText from 'components/InputText';
import QrScannerAva from 'components/QrScannerAva';
import AvaButton from 'components/AvaButton';
import QRCode from 'components/svg/QRCodeSVG';
import {useNavigation} from '@react-navigation/native';
import {
  getContractDataErc20,
  isValidAddress,
} from '@avalabs/avalanche-wallet-sdk';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import Avatar from 'components/Avatar';
import useAddCustomToken from 'screens/tokenManagement/hooks/useAddCustomToken';
import {Erc20TokenData} from '@avalabs/avalanche-wallet-sdk/dist/Asset/types';
import {ShowSnackBar} from 'components/Snackbar';
import {useWalletStateContext} from '@avalabs/wallet-react-components';

const AddCustomToken: FC = () => {
  const theme = useApplicationContext().theme;
  const [tokenAddress, setTokenAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>();
  const walletState = useWalletStateContext();
  const [token, setToken] = useState<Erc20TokenData>();
  const [showQrCamera, setShowQrCamera] = useState(false);
  const {addCustomToken} = useAddCustomToken();
  const {goBack} = useNavigation();

  /**
   * Calls addCustom token where other checks are done
   * and saves it to the repo.
   */
  async function addToken() {
    addCustomToken(tokenAddress)
      .then(() => {
        ShowSnackBar('Added!');
        goBack();
      })
      .catch(error => {
        // console.error(error);
        setErrorMessage(error);
      });
  }

  /**
   * Checks if token is already coming through in the wallet state
   */
  const tokenAlreadyExists = useMemo(
    () =>
      tokenAddress?.length &&
      walletState?.erc20Tokens.some(
        ({address}: {address: string}) => address === tokenAddress,
      ),
    [walletState?.erc20Tokens, tokenAddress],
  );

  useEffect(() => {
    // some validation
    setErrorMessage(undefined);
    (async () => {
      if (isValidAddress(tokenAddress)) {
        getContractDataErc20(tokenAddress)
          .then(tokenData => {
            // if there's no error but no data, set error.
            if (!tokenData) {
              setErrorMessage('Invalid ERC-20 token address.');
            }

            // set token data
            setToken(tokenData);

            // if token aready exists in list, just want user, do nothing
            if (tokenAlreadyExists) {
              setErrorMessage('Token already exists in your wallet.');
            }
          })
          .catch(error => {
            setErrorMessage(error.message);
          });
      } else {
        // reset token
        setToken(undefined);
        // only start showing error after a certain length
        if (tokenAddress.length > 10) {
          setErrorMessage('Invalid ERC-20 token address.');
        }
      }
    })();
  }, [tokenAddress]);

  // only enable button if we have token and no error message
  const disabled = !!(errorMessage || !token);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        justifyContent: 'space-between',
      }}>
      <View style={styles.horizontalLayout}>
        <View style={[{flex: 1, paddingStart: 4, paddingEnd: 4}]}>
          <InputText
            minHeight={72}
            label={'Token contract address'}
            placeholder="Token contract address"
            multiline={true}
            errorText={errorMessage}
            onChangeText={setTokenAddress}
          />
          {tokenAddress.length === 0 && (
            <View
              style={{
                position: 'absolute',
                right: 24,
                top: 40,
              }}>
              <AvaButton.Icon onPress={() => setShowQrCamera(true)}>
                <QRCode />
              </AvaButton.Icon>
            </View>
          )}
        </View>
      </View>

      {!!token && (
        <View style={{justifyContent: 'center', alignItems: 'center'}}>
          {/* placeholder for image or initials if there's no image available*/}
          <Avatar.Custom name={token?.name} symbol={token?.symbol} size={88} />
          <Space y={16} />
          <AvaText.Heading2>{token?.name}</AvaText.Heading2>
        </View>
      )}

      <AvaButton.PrimaryLarge
        disabled={disabled}
        style={{margin: 16}}
        onPress={addToken}>
        Add
      </AvaButton.PrimaryLarge>

      <Modal
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQrCamera(false)}
        visible={showQrCamera}>
        <QrScannerAva
          onSuccess={setTokenAddress}
          onCancel={() => setShowQrCamera(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalLayout: {
    paddingTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AddCustomToken;
