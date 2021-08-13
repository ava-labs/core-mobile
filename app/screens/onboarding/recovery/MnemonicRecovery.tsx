import React, {useCallback, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import WordList from './WordList';
import Word from './Word';
import Header from 'screens/mainView/Header';
import {Buffer} from 'buffer';
import {PHRASE_STATUS} from './SortableWord';

const RAW_WORDS = [
  'dog',
  'lamp',
  'plant',
  'straw',
  // 'food',
  // 'sunshine',
  // 'glass',
  // 'charger',
  // 'door',
  // 'pencil',
  // 'desk',
  // 'phone',
  // 'watch',
  // 'speaker',
  // 'notepad',
  // 'socks',
  // 'painting',
  // 'glitter',
  // 'notes',
  // 'purse',
  // 'dress',
  // 'chips',
  // 'box',
  // 'shoes',
];

const words = RAW_WORDS.map((w: string, index: number) => {
  return {
    id: index,
    word: w,
  };
});

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
  onBack: () => void;
}

const MnemonicRecovery = ({onBack}: Props) => {
  const [phraseStatus, setPhraseStatus] = useState(PHRASE_STATUS.NO_WORDS);

  const getWords = useCallback(() => {
    return words.map(word => <Word key={word.id} {...word} />);
  }, []);

  const correctHash = 'c3RyYXcsZG9nLGxhbXAscGxhbnQ=';

  const orderedWords = new Array(RAW_WORDS.length - 1);
  const onCompleted = (order: number[], status: PHRASE_STATUS) => {
    setPhraseStatus(status);

    if (status === PHRASE_STATUS.ALL_WORDS) {
      order.map((position: number, index: number) => {
        orderedWords[position] = RAW_WORDS[index];
      });
      console.debug(orderedWords.toString());
      const genHash = Buffer.from(orderedWords.toString()).toString('base64');
      console.debug(genHash);
      if (genHash === correctHash) {
        setPhraseStatus(PHRASE_STATUS.VALID_PHRASE);
      } else {
        setPhraseStatus(PHRASE_STATUS.INVALID_PHRASE);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Header showBack onBack={onBack} />
      <View style={{alignItems: 'center'}}>
        <Text style={styles.title}>Recovery phrase</Text>
        <Text style={styles.subTitle}>Drag words in correct order</Text>
      </View>
      <WordList onCompleted={onCompleted} phraseStatus={phraseStatus}>
        {getWords()}
      </WordList>
    </View>
  );
};

export default MnemonicRecovery;
