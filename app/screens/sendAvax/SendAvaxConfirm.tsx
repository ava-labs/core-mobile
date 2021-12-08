import React, {useState} from 'react';
import {Modal, ScrollView, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {SendTokenParamList} from 'screens/sendERC20/SendERC20Stack';
import Loader from 'components/Loader';
import {useSelectedTokenContext} from 'contexts/SelectedTokenContext';
import Avatar from 'components/Avatar';
import AvaListItem from 'components/AvaListItem';
import FlexSpacer from 'components/FlexSpacer';
import CollapsibleSection from 'components/CollapsibleSection';
import ZeroState from 'components/ZeroState';

export interface ISendConfirm {
  imageUrl?: string;
  name?: string;
  fee: string;
  amount: string;
  address?: string;
  onConfirm?: (onSuccess: () => void, onError: (error: any) => void) => void;
}

export type SendConfirmRouteProp = RouteProp<SendTokenParamList>;

export default function SendAvaxConfirm() {
  const context = useApplicationContext();
  const {goBack} = useNavigation();
  const route = useRoute<SendConfirmRouteProp>();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<Error>();

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

  const errorComponent = (
    <>
      <AvaButton.PrimaryLarge onPress={confirmTransaction}>
        Retry
      </AvaButton.PrimaryLarge>
      <Space y={24} />
      <AvaButton.TextLarge onPress={goBack}>
        Back to Portfolio
      </AvaButton.TextLarge>
    </>
  );

  const centerComponents = (
    <View
      style={{
        alignItems: 'center',
      }}>
      {selectedToken && <Avatar.Token token={selectedToken} size={48} />}
      <AvaText.Body1 textStyle={{marginTop: 8}}>Payment amount</AvaText.Body1>
      <AvaText.LargeTitleBold textStyle={{marginVertical: 6}}>
        {amount + ' ' + selectedToken?.symbol}
      </AvaText.LargeTitleBold>
      <AvaText.Heading1 color={context.theme.colorText2}>
        {'$343.34 USD'}
      </AvaText.Heading1>
    </View>
  );

  function onSuccess() {
    setLoading(false);
  }

  function onError(error: any) {
    setLoading(false);
    setSubmitError(error);
  }

  function confirmTransaction() {
    if (onConfirm) {
      setSubmitError(undefined);
      setLoading(true);
      onConfirm(onSuccess, onError);
    }
  }

  return (
    <View style={{flex: 1}}>
      {submitError ? (
        <View style={{marginHorizontal: 16, flex: 1}}>
          <ZeroState.SendError
            message={submitError?.message}
            additionalComponent={errorComponent}
          />
        </View>
      ) : (
        <>
          <ScrollView>
            <Space y={16} />

            {centerComponents}

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
            onPress={confirmTransaction}>
            Confirm transaction
          </AvaButton.PrimaryLarge>
        </>
      )}
    </View>
  );
}
