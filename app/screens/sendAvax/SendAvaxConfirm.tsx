import React, {useState} from 'react';
import {Modal, ScrollView, StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';
import OvalTagBg from 'components/OvalTagBg';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import {Opacity50} from 'resources/Constants';
import {RouteProp, useRoute} from '@react-navigation/native';
import {SendTokenParamList} from 'screens/sendERC20/SendERC20Stack';
import Loader from 'components/Loader';
import {useSelectedTokenContext} from 'contexts/SelectedTokenContext';
import Avatar from 'components/Avatar';
import MovementIndicator from 'components/MovementIndicator';
import AvaListItem from 'components/AvaListItem';
import FlexSpacer from 'components/FlexSpacer';
import Collapsible from 'react-native-collapsible';
import CollapsibleSection from 'components/CollapsibleSection';

export interface ISendConfirm {
  imageUrl?: string;
  name?: string;
  fee: string;
  amount: string;
  address?: string;
  onConfirm?: (doneLoading: () => void) => void;
}

export type SendConfirmRouteProp = RouteProp<SendTokenParamList>;

export default function SendAvaxConfirm() {
  const context = useApplicationContext();
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
    <View style={{flex: 1}}>
      <ScrollView>
        <Space y={16} />

        {/* centered views */}
        <View
          style={{
            alignItems: 'center',
          }}>
          {selectedToken && <Avatar.Token token={selectedToken} size={48} />}
          <AvaText.Body1 textStyle={{marginTop: 8}}>
            Payment amount
          </AvaText.Body1>
          <AvaText.LargeTitleBold textStyle={{marginVertical: 6}}>
            {amount + ' ' + selectedToken?.symbol}
          </AvaText.LargeTitleBold>
          <AvaText.Heading1 color={context.theme.colorText2}>
            {'$343.34 USD'}
          </AvaText.Heading1>
        </View>

        <Space y={50} />
        <AvaListItem.Base label={'Send to'} title={address} embedInCard />
        <Space y={16} />

        <CollapsibleSection
          title={
            <AvaListItem.Base
              label={'Transaction fee'}
              title={`${fee} AVAX`}
              embedInCard
              disablePress
            />
          }>
          <>{/*Future expandable content will go here*/}</>
        </CollapsibleSection>
        <FlexSpacer />
        {loading && showLoading}
      </ScrollView>
      <AvaButton.PrimaryLarge
        style={{margin: 16}}
        onPress={() => {
          onConfirm && onConfirm(() => setLoading(false));
          setLoading(true);
        }}>
        Send
      </AvaButton.PrimaryLarge>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
