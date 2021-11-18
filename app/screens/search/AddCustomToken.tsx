import React, {FC, useCallback, useEffect, useState} from 'react';
import {Alert, Modal, StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import InputText from 'components/InputText';
import QrScannerAva from 'components/QrScannerAva';
import AvaButton from 'components/AvaButton';
import QRCode from 'components/svg/QRCode';
import {useNavigation} from '@react-navigation/native';
import {Assets, Utils} from '@avalabs/avalanche-wallet-sdk';
import {Erc20Token} from '@avalabs/avalanche-wallet-sdk/dist/Asset';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import Avatar from 'components/Avatar';

const AddCustomToken: FC = () => {
  const theme = useApplicationContext().theme;
  const [tokenAddress, setTokenAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>();
  const [token, setToken] = useState<Erc20Token>();
  const [showQrCamera, setShowQrCamera] = useState(false);
  const {goBack} = useNavigation();

  const getToken = useCallback(async (address: string) => {
    try {
      const tkn = await Assets.getErc20Token(address);
      setToken(tkn);
      console.log(tkn);
    } catch (e) {
      console.log(e);
    }
  }, []);

  useEffect(() => {
    // some validation
    if (Utils.isValidAddress(tokenAddress)) {
      setErrorMessage(undefined);
      getToken(tokenAddress);
    } else {
      if (tokenAddress.length > 10) {
        setErrorMessage('Invalid address');
      } else {
        setErrorMessage(undefined);
      }
      setToken(undefined);
    }
  }, [tokenAddress]);

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
          <Avatar.Token token={token} />
          <Space y={16} />
          <AvaText.Heading2>{token?.name}</AvaText.Heading2>
        </View>
      )}

      <AvaButton.PrimaryLarge
        disabled={!token}
        style={{margin: 16}}
        onPress={() => {
          Alert.alert('Almost there', 'waiting library function to add token');
          goBack();
        }}>
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
