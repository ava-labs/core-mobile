import React, {useContext, useEffect, useState} from 'react';
import {Alert, Modal, SafeAreaView, ScrollView} from 'react-native';
import Loader from 'components/Loader';
import ValidateViewModel from './ValidateViewModel';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import ValidateConfirm from './ValidateConfirm';
import {debounceTime} from 'rxjs/operators';
import TextTitle from 'components/TextTitle';
import InputAmount from 'components/InputAmount';
import InputText from 'components/InputText';
import ButtonAva from 'components/ButtonAva';
import Header from 'screens/mainView/Header';
import {Subscription} from 'rxjs';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  wallet: MnemonicWallet;
  onClose: () => void;
};

export default function Validate(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const [viewModel] = useState(new ValidateViewModel(props.wallet));
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderMsg, setLoaderMsg] = useState('');
  const [backgroundStyle] = useState(context.backgroundStyle);
  const [nodeId, setNodeId] = useState('NodeID-');
  const [endDatePickerVisible, setEndDatePickerVisible] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [stakingDuration, setStakingDuration] = useState('');
  const [stakeAmount, setStakeAmount] = useState('0.00');
  const [delegationFee, setDelegationFee] = useState('2');
  const [rewardAddress, setRewardAddress] = useState('2');
  const [validateConfirmVisible, setValidateConfirmVisible] = useState(false);

  useEffect(() => {
    const disposables = new Subscription();
    disposables.add(
      viewModel.loaderVisible
        .pipe(
          debounceTime(300), //fixes problem with loader hanging if setstate changes state too quickly
        )
        .subscribe(value => setLoaderVisible(value)),
    );
    disposables.add(
      viewModel.loaderMsg.subscribe(value => setLoaderMsg(value)),
    );
    disposables.add(
      viewModel.endDate.subscribe(value => setEndDate(value.toLocaleString())),
    );
    disposables.add(
      viewModel.stakingDuration.subscribe(value => setStakingDuration(value)),
    );
    disposables.add(
      viewModel.endDatePickerVisible.subscribe(value =>
        setEndDatePickerVisible(value),
      ),
    );
    setRewardAddressToThisWallet();

    return () => {
      disposables.unsubscribe();
      viewModel.cleanup();
    };
  }, []);

  const setRewardAddressToThisWallet = (): void => {
    setRewardAddress(viewModel.wallet.value.getAddressP());
  };

  const onSetEndDate = (date: Date): void => {
    viewModel.setEndDate(date).subscribe({
      error: err => Alert.alert('Error', err.message),
      complete: () => setEndDatePickerVisible(false),
    });
  };

  const onConfirm = (): void => {
    setValidateConfirmVisible(true);
  };

  const onSubmit = (): void => {
    setValidateConfirmVisible(false);
    viewModel
      .submitValidator(
        nodeId,
        stakeAmount,
        viewModel.startDate.value.toLocaleString(),
        endDate,
        delegationFee,
        rewardAddress,
      )
      .subscribe({
        error: err => Alert.alert('Error', err.message),
        complete: () => Alert.alert('Finished'),
      });
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <ScrollView>
        <Header showBack onBack={props.onClose} />
        <TextTitle text={'Validate'} />
        <TextTitle text={'Node ID:'} size={18} />
        <InputText value={nodeId} onChangeText={text => setNodeId(text)} />

        <TextTitle text={'Staking End Date:'} size={18} />
        <ButtonAva
          text={endDate}
          onPress={() => setEndDatePickerVisible(true)}
        />
        <DateTimePickerModal
          isVisible={endDatePickerVisible}
          mode="datetime"
          onConfirm={date => onSetEndDate(date)}
          onCancel={() => setEndDatePickerVisible(false)}
        />

        <TextTitle text={'Staking Duration:'} size={18} />
        <TextTitle text={stakingDuration} size={18} bold={true} />

        <TextTitle text={'Stake amount:'} size={18} />
        <InputAmount onChangeText={text => setStakeAmount(text)} />

        <TextTitle text={'Delegation fee (%):'} size={18} />
        <InputAmount
          initValue={delegationFee}
          onChangeText={text => setDelegationFee(text)}
        />

        <TextTitle text={'Reward Address:'} size={18} />
        <InputText
          value={rewardAddress}
          onChangeText={text => setRewardAddress(text)}
        />

        <ButtonAva
          text={'Set to this wallet'}
          onPress={() => setRewardAddressToThisWallet()}
        />
        <ButtonAva
          text={'Custom address'}
          onPress={() => setRewardAddress('')}
        />
        <ButtonAva text={'Confirm'} onPress={() => onConfirm()} />

        <Modal
          animationType="slide"
          transparent={true}
          visible={validateConfirmVisible}>
          <ValidateConfirm
            nodeId={nodeId}
            stakingAmount={stakeAmount}
            endDate={endDate}
            delegationFee={delegationFee}
            rewardAddress={rewardAddress}
            onSubmit={() => onSubmit()}
            onClose={() => setValidateConfirmVisible(false)}
          />
        </Modal>

        <Modal animationType="fade" transparent={true} visible={loaderVisible}>
          <Loader message={loaderMsg} />
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}
