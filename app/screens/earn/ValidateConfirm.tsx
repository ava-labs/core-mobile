import React, {useState} from 'react';
import {
  Appearance,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import CommonViewModel from 'utils/CommonViewModel';
import TextTitle from 'components/TextTitle';
import InputText from 'components/InputText';
import InputAmount from 'components/InputAmount';
import ButtonAva from 'components/ButtonAva';

type Props = {
  nodeId: string;
  stakingAmount: string;
  endDate: string;
  delegationFee: string;
  rewardAddress: string;
  onSubmit: () => void;
  onClose: () => void;
};

export default function ValidateConfirm(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(
    new CommonViewModel(Appearance.getColorScheme()),
  );
  const [isDarkMode, setIsDarkMode] = useState(commonViewModel.isDarkMode);
  const [backgroundStyle, setBackgroundStyle] = useState(
    commonViewModel.backgroundStyle,
  );

  return (
    <SafeAreaView style={backgroundStyle}>
      <ScrollView>
        <TextTitle text={'Check data and confirm'} />
        <TextTitle text={'Node ID:'} size={18} />
        <InputText editable={false} value={props.nodeId} />

        <TextTitle text={'Staking amount:'} size={18} />
        <InputAmount editable={false} initValue={props.stakingAmount} />

        <TextTitle text={'Start date:'} size={18} />
        <InputText
          editable={false}
          value={
            'Your validation will start at least 5 minutes after you submit this form.'
          }
        />

        <TextTitle text={'End date:'} size={18} />
        <InputText editable={false} value={props.endDate} />

        <TextTitle text={'Delegation fee:'} size={18} />
        <InputAmount editable={false} initValue={props.delegationFee} />

        <TextTitle text={'Reward address:'} size={18} />
        <InputText editable={false} value={props.rewardAddress} />

        <View style={styles.horizontalLayout}>
          <ButtonAva text={'Cancel'} onPress={props.onClose} />
          <ButtonAva text={'Confirm'} onPress={props.onSubmit} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles: any = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
