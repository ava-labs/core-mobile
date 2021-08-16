import React, {useContext, useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import WordList from './WordList';
import Word from './Word';
import Header from 'screens/mainView/Header';
import {PHRASE_STATUS} from './SortableWord';
import LoadingIndicator from 'components/LoadingIndicator';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {Buffer} from 'buffer';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  subTitle: {
    color: 'black',
    fontSize: 16,
    paddingTop: 10,
  },
  title: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
    paddingTop: 10,
  },
  darkText: {
    color: 'white',
  },
});

interface Props {
  onSuccess: () => void;
  onBack: () => void;
  mnemonic: string;
}

interface MnemonicWord {
  id: number;
  word: string;
}

const CheckMnemonic = ({onBack, onSuccess, mnemonic}: Props) => {
  const context = useContext(ApplicationContext);
  const isDarkMode = context.isDarkMode;
  const [loading, setLoading] = useState(false);
  const [scrambledWords, setScrambledWords] = useState<MnemonicWord[]>([]);
  const [phraseStatus, setPhraseStatus] = useState(PHRASE_STATUS.NO_WORDS);

  /* Randomize array in-place using Durstenfeld shuffle algorithm */
  async function shuffleMnemonics(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array.map((w, index): MnemonicWord => {
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
  }, [mnemonic]);

  const onVerify = async (order: number[]) => {
    const orderedWords = new Array(scrambledWords.length - 1);

    // put create array with ordered words in correct position
    order.map((position: number, index: number) => {
      orderedWords[position] = scrambledWords[index].word;
    });

    // gen hashes
    const orderedHash = Buffer.from(orderedWords.join(' ')).toString('base64');
    const mnemonicHash = Buffer.from(mnemonic.toString()).toString('base64');

    // compare hashes
    if (orderedHash === mnemonicHash) {
      setPhraseStatus(PHRASE_STATUS.VALID_PHRASE);
      onSuccess();
    } else {
      setPhraseStatus(PHRASE_STATUS.INVALID_PHRASE);
    }
  };

  const onCompleted = async (order: number[], status: PHRASE_STATUS) => {
    setPhraseStatus(status);

    if (status === PHRASE_STATUS.ALL_WORDS) {
      await onVerify(order);
    }
  };

  return (
    <View style={[styles.container, isDarkMode && {backgroundColor: '#000'}]}>
      <Header showBack onBack={onBack} />
      <View style={{alignItems: 'center'}}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>
          Recovery phrase
        </Text>
        <Text style={[styles.subTitle, isDarkMode && styles.darkText]}>
          Drag words in correct order
        </Text>
      </View>
      {loading ? (
        <LoadingIndicator size={'large'} />
      ) : (
        <WordList onCompleted={onCompleted} phraseStatus={phraseStatus}>
          {scrambledWords.map((word: MnemonicWord) => (
            <Word key={word.id} {...word} />
          ))}
        </WordList>
      )}
    </View>
  );
};

export default CheckMnemonic;
