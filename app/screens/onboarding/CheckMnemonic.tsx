import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import AvaButton from 'components/AvaButton';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import WordSelection from 'screens/onboarding/WordSelection';
import {ShowSnackBar} from 'components/Snackbar';
import {useCheckMnemonic} from 'screens/onboarding/useCheckMnemonic';

type Props = {
  onSuccess: () => void;
  onBack: () => void;
  mnemonic: string;
};

export default function CheckMnemonic(
  props: Props | Readonly<Props>,
): JSX.Element {
  const {firstWordSelection, secondWordSelection, thirdWordSelection, verify} =
    useCheckMnemonic(props.mnemonic);

  const onVerify = (): void => {
    if (
      [selectedWord1, selectedWord2, selectedWord3].find(value => !value) !==
      undefined
    ) {
      ShowSnackBar('Select all words');
      return;
    }

    if (verify(selectedWord1, selectedWord2, selectedWord3)) {
      props.onSuccess();
    } else {
      ShowSnackBar('Incorrect! Try again, please.');
    }
  };

  const [selectedWord1, setSelectedWord1] = useState('');
  const [selectedWord2, setSelectedWord2] = useState('');
  const [selectedWord3, setSelectedWord3] = useState('');

  useEffect(() => {}, [selectedWord1, selectedWord2, selectedWord3]);

  return (
    <View style={styles.container}>
      <AvaText.Body1>
        Select the words below to verify your Recovery Phrase.
      </AvaText.Body1>
      <Space y={24} />
      <WordSelection
        wordIndex={firstWordSelection.index}
        wordOptions={firstWordSelection.wordOptions}
        setSelectedWord={setSelectedWord1}
      />
      <Space y={24} />
      <WordSelection
        wordIndex={secondWordSelection.index}
        wordOptions={secondWordSelection.wordOptions}
        setSelectedWord={setSelectedWord2}
      />
      <Space y={24} />
      <WordSelection
        wordIndex={thirdWordSelection.index}
        wordOptions={thirdWordSelection.wordOptions}
        setSelectedWord={setSelectedWord3}
      />
      <View style={{flex: 1}} />
      <View>
        <AvaButton.PrimaryLarge onPress={onVerify}>
          Verify phrase
        </AvaButton.PrimaryLarge>
      </View>
    </View>
  );
}

const styles: any = StyleSheet.create({
  container: {
    height: '100%',
    padding: 16,
  },
});
