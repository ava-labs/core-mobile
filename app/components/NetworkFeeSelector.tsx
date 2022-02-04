import {Row} from 'components/Row';
import AvaText from 'components/AvaText';
import {TextInput, View} from 'react-native';
import AvaButton from 'components/AvaButton';
import SettingsCogSVG from 'components/svg/SettingsCogSVG';
import {Space} from 'components/Space';
import React, {FC, RefObject, useEffect, useRef, useState} from 'react';
import {useApplicationContext} from 'contexts/ApplicationContext';
import InputText from 'components/InputText';
import {Opacity50} from 'resources/Constants';

const NetworkFeeSelector = ({
  networkFeeAvax,
  networkFeeUsd,
  onSelectedPreset,
  onGasPriceEntered,
  onSettings,
}: {
  networkFeeAvax: string;
  networkFeeUsd: string;
  onSelectedPreset: (preset: FeePreset) => void;
  onGasPriceEntered: (gasPrice: string) => void;
  onSettings: () => void;
}) => {
  const [selectedPreset, setSelectedPreset] = useState(FeePreset.Normal);
  useEffect(() => {
    onSelectedPreset(selectedPreset);
  }, [selectedPreset]);

  const [customGasPrice, setCustomGasPrice] = useState('0');
  useEffect(() => {
    onGasPriceEntered(customGasPrice);
  }, [customGasPrice]);

  return (
    <>
      <Row>
        <AvaText.Body2>Network Fee</AvaText.Body2>
        <View style={{position: 'absolute', right: 0, top: -8}}>
          <AvaButton.Icon onPress={onSettings}>
            <SettingsCogSVG />
          </AvaButton.Icon>
        </View>
      </Row>
      <Space y={4} />
      <Row style={{alignItems: 'baseline'}}>
        <AvaText.Heading3>{networkFeeAvax} AVAX</AvaText.Heading3>
        <Space x={4} />
        <AvaText.Body3 textStyle={{paddingBottom: 2}}>
          ${networkFeeUsd} USD
        </AvaText.Body3>
      </Row>
      <Space y={8} />
      <Row
        style={{
          justifyContent: 'space-evenly',
          alignItems: 'center',
        }}>
        <FeeSelector
          label={FeePreset.Normal}
          selected={selectedPreset === FeePreset.Normal}
          onSelect={() => setSelectedPreset(FeePreset.Normal)}
        />
        <FeeSelector
          label={FeePreset.Fast}
          selected={selectedPreset === FeePreset.Fast}
          onSelect={() => setSelectedPreset(FeePreset.Fast)}
        />
        <FeeSelector
          label={FeePreset.Instant}
          selected={selectedPreset === FeePreset.Instant}
          onSelect={() => setSelectedPreset(FeePreset.Instant)}
        />
        <FeeSelector
          editable
          label={FeePreset.Custom}
          selected={selectedPreset === FeePreset.Custom}
          onSelect={() => setSelectedPreset(FeePreset.Custom)}
          value={customGasPrice}
          onValueEntered={value => setCustomGasPrice(value)}
        />
      </Row>
    </>
  );
};

const FeeSelector: FC<{
  label: string;
  value?: string;
  selected: boolean;
  onSelect: (value: string) => void;
  editable?: boolean;
  onValueEntered?: (value: string) => void;
}> = ({label, selected, onSelect, onValueEntered, value, editable = false}) => {
  const {theme} = useApplicationContext();
  const [showInput, setShowInput] = useState(false);
  const [selectedAtLeastOnce, setSelectedAtLeastOnce] = useState(false);

  let inputRef = useRef() as RefObject<TextInput>;

  useEffect(() => {
    if (selected && editable) {
      setShowInput(true);
      setSelectedAtLeastOnce(true);
    }
    if (!selected) {
      setShowInput(false);
      inputRef.current?.blur();
    }
  }, [selected]);

  return (
    <View
      style={{
        alignItems: 'center',
        width: 66,
        height: 40,
      }}>
      {showInput && (
        <InputText
          text={value?.toString()}
          autoFocus
          onChangeText={text => onValueEntered?.(text)}
          keyboardType={'numeric'}
          onInputRef={inputRef1 => {
            inputRef = inputRef1;
            inputRef1.current?.setNativeProps({
              style: {
                backgroundColor: theme.colorText1,
                width: 66,
                height: 40,
                marginTop: -12,
                fontFamily: 'Inter-SemiBold',
                textAlign: 'center',
                textAlignVertical: 'center',
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
                paddingRight: 0,
                color: theme.colorBg2,
                fontSize: 14,
                lineHeight: 24,
              },
            });
          }}
          mode={'amount'}
        />
      )}
      {!showInput && (
        <AvaButton.Base onPress={() => onSelect(label)}>
          <View
            focusable
            style={{
              width: 66,
              height: 40,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selected
                ? theme.colorText1
                : theme.colorBg3 + Opacity50,
            }}>
            <AvaText.ButtonMedium
              textStyle={{color: selected ? theme.colorBg2 : theme.colorText2}}>
              {editable && selectedAtLeastOnce && value ? value : label}
            </AvaText.ButtonMedium>
          </View>
        </AvaButton.Base>
      )}
    </View>
  );
};

export enum FeePreset {
  Normal = 'Normal',
  Fast = 'Fast',
  Instant = 'Instant',
  Custom = 'Custom',
}

export default NetworkFeeSelector;
