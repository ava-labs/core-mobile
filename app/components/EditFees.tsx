import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import {View} from 'react-native';
import InputText from 'components/InputText';
import AvaButton from 'components/AvaButton';
import React, {useMemo, useState} from 'react';
import {popableContent} from 'screens/swap/components/SwapTransactionDetails';
import {useApplicationContext} from 'contexts/ApplicationContext';
import FlexSpacer from 'components/FlexSpacer';
import {Row} from 'components/Row';
import {mustNumber} from 'utils/JsTools';

const EditFees = ({
  networkFee,
  gasLimit,
  onSave,
}: {
  networkFee: string;
  gasLimit: string;
  onSave: (newGasLimit: number) => void;
}) => {
  const {theme} = useApplicationContext();
  const [newGasLimit, setNewGasLimit] = useState(gasLimit);

  const gasLimitInfoInfoMessage = useMemo(
    () =>
      popableContent(
        'Gas limit is the maximum units of gas you are willing to use.',
        theme.colorBg3,
      ),
    [theme],
  );

  return (
    <View style={{flex: 1, paddingBottom: 16}}>
      <AvaText.LargeTitleBold textStyle={{marginHorizontal: 12}}>
        Edit Gas Limit
      </AvaText.LargeTitleBold>
      <Space y={24} />
      <Row style={{marginHorizontal: 12, alignItems: 'flex-end'}}>
        <AvaText.Heading1>{networkFee}</AvaText.Heading1>
        <Space x={4} />
        <AvaText.Heading3>AVAX</AvaText.Heading3>
      </Row>
      <InputText
        label={'Gas Limit ⓘ'}
        mode={'amount'}
        text={newGasLimit}
        popOverInfoText={gasLimitInfoInfoMessage}
        onChangeText={text => setNewGasLimit(text)}
      />
      <FlexSpacer />
      <AvaButton.PrimaryLarge
        style={{marginHorizontal: 12}}
        onPress={() =>
          onSave(mustNumber(() => Number.parseFloat(newGasLimit), 0))
        }>
        Save
      </AvaButton.PrimaryLarge>
    </View>
  );
};
export default EditFees;
