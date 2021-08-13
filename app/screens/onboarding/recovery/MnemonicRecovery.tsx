import React, {useCallback, useState} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import WordList from './WordList';
import Word from './Word';
import Header from 'screens/mainView/Header';
import {Buffer} from 'buffer';

const RAW_WORDS = [
  'dog',
  'lamp',
  'plant',
  'straw',
  'food',
  'sunshine',
  'glass',
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

  const [isValidPhrase, setIsValidPhrase] = useState<boolean | undefined>(undefined)

  const getWords = useCallback(() => {
    return words.map(word => <Word key={word.id} {...word} />);
  }, []);

  const correctHash =
    'Z2xhc3MsZG9nLGxhbXAscGxhbnQsc3RyYXcsZm9vZCxzdW5zaGluZQ==';

  const orderedWords = new Array(RAW_WORDS.length - 1);
  const onCompleted = (order: number[]) => {
    order.map((position: number, index: number) => {
      orderedWords[position] = RAW_WORDS[index];
    });
    console.debug(orderedWords);
    const genHash = Buffer.from(orderedWords.toString()).toString('base64');
    if (genHash === correctHash) {

    }
  };

  return (
    <View style={styles.container}>
      <Header showBack onBack={onBack} />
      <View style={{alignItems: 'center'}}>
        <Text style={styles.title}>Recovery phrase</Text>
        <Text style={styles.subTitle}>Drag words in correct order</Text>
      </View>
      <WordList onCompleted={onCompleted} isValidPhrase >{getWords()}</WordList>
    </View>
  );
};

export default MnemonicRecovery;
