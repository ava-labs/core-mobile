import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import WordList from './WordList';
import Word from './Word';
import Header from 'screens/mainView/Header';
import {PHRASE_STATUS} from './SortableWord';
import CheckMnemonicViewModel from 'screens/onboarding/CheckMnemonicViewModel';
import LoadingIndicator from 'components/LoadingIndicator';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
  },
  subTitle: {
    color: 'white',
    fontSize: 16,
    paddingTop: 10,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    paddingTop: 10,
  },
});

interface Props {
  onSuccess: () => void;
  onBack: () => void;
  mnemonic: string;
}

interface Word {
  id: number;
  word: string;
}

const CheckMnemonic = ({onBack, onSuccess, mnemonic}: Props) => {
  const [viewModel] = useState(new CheckMnemonicViewModel(mnemonic));
  const [loading, setLoading] = useState(false);
  const [scrambledWords, setScrambledWords] = useState<Word[]>([]);
  const [phraseStatus, setPhraseStatus] = useState(PHRASE_STATUS.NO_WORDS);

  /* Randomize array in-place using Durstenfeld shuffle algorithm */
  async function shuffleMnemonics(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array.map((w, index): Word => {
      return {
        id: index,
        word: w,
      };
    });
  }

  useEffect(() => {
    setLoading(true);
    const scrambledMnemonics = async () => {
      setScrambledWords(await shuffleMnemonics(mnemonic.split(' ')));
      setLoading(false);
    };
    scrambledMnemonics();
  },[mnemonic]);

  const onVerify = async (order: number[]) => {
    const orderedWords = new Array(scrambledWords.length - 1);
    order.map((position: number, index: number) => {
      orderedWords[position] = scrambledWords[index].word;
    });

    orderedWords.forEach((word: string, index: number) => {
      viewModel.setMnemonic(index, word);
    });

    viewModel.onVerify().subscribe({
      error: () => {
        setPhraseStatus(PHRASE_STATUS.INVALID_PHRASE);
      },
      complete: onSuccess,
    });
  };

  const onCompleted = async (order: number[], status: PHRASE_STATUS) => {
    setPhraseStatus(status);

    if (status === PHRASE_STATUS.ALL_WORDS) {
      await onVerify(order);
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack onBack={onBack} />
      <View style={{alignItems: 'center'}}>
        <Text style={styles.title}>Recovery phrase</Text>
        <Text style={styles.subTitle}>Drag words in correct order</Text>
      </View>
      {loading ? (
        <LoadingIndicator size={'large'} />
      ) : (
        <WordList onCompleted={onCompleted} phraseStatus={phraseStatus}>
          {scrambledWords.map((word: Word) => (
            <Word key={word.id} {...word} />
          ))}
        </WordList>
      )}
    </View>
  );
};

export default CheckMnemonic;
