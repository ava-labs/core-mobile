import React, {useState} from 'react';
import {Modal, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';
import OvalTagBg from 'components/OvalTagBg';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import {Opacity50} from 'resources/Constants';
import {useRoute} from '@react-navigation/native';
import {SendConfirmRouteProp} from 'screens/sendAvax/SendAvaxConfirm';
import Loader from 'components/Loader';
import Avatar from 'components/Avatar';
import {useSelectedTokenContext} from 'contexts/SelectedTokenContext';

export default function SendANTConfirm() {
  const context = useApplicationContext();
  const [backgroundStyle] = useState(context.backgroundStyle);
  const route = useRoute<SendConfirmRouteProp>();
  const [loading, setLoading] = useState(false);

  const {selectedToken} = useSelectedTokenContext();
  const amount = route?.params?.payload?.amount;
  const address = route?.params?.payload?.address;
  const fee = route?.params?.payload?.fee;
  const onConfirm = route?.params?.payload?.onConfirm;

  const showLoading = (
    <Modal animationType="fade" transparent={true} visible={loading}>
      <Loader message={'Sending...'} />
    </Modal>
  );

  return (
    <View
      style={[
        backgroundStyle,
        {
          alignItems: 'center',
          backgroundColor: undefined, //cancel backgroundColor from backgroundStyle
          paddingLeft: 0,
          paddingStart: 0,
          paddingEnd: 0,
          paddingRight: 0,
        },
      ]}>
      <Space y={51} />
      {selectedToken && <Avatar.Token token={selectedToken} />}
      <Space y={16} />
      <AvaText.Heading1>
        {amount + ' ' + selectedToken?.symbol}
      </AvaText.Heading1>
      <Space y={8} />

      <Space y={32} />
      <OvalTagBg color={context.theme.colorBg3 + Opacity50}>
        <AvaText.Tag>Send to</AvaText.Tag>
      </OvalTagBg>
      <Space y={32} />

      <View style={{paddingLeft: 24, paddingRight: 24}}>
        <AvaText.Heading2>{address}</AvaText.Heading2>
      </View>

      <View style={{flex: 1}} />
      <View style={{alignSelf: 'flex-start', marginLeft: 16}}>
        <AvaText.Body3
          textStyle={{
            textAlign: 'right',
            color: context.theme.txtListItemSubscript,
          }}>
          {'Fee: ' + fee}
        </AvaText.Body3>
      </View>
      <View style={{width: '100%'}}>
        <AvaButton.PrimaryLarge
          style={{margin: 16}}
          onPress={() => {
            onConfirm && onConfirm(() => setLoading(false));
            setLoading(true);
          }}>
          Send
        </AvaButton.PrimaryLarge>
      </View>
      {loading && showLoading}
    </View>
  );
}
