import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {WORD_HEIGHT} from './Layout';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'black',
    borderColor: '#E8E6E8',
    borderRadius: 10,
    borderWidth: 1,
    height: WORD_HEIGHT - 8,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  root: {
    padding: 4,
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
});

interface WordProps {
  id: number;
  word: string;
}

const Word = ({word}: WordProps) => (
  <View style={styles.root}>
    <View>
      <View style={styles.container}>
        <Text style={styles.text} adjustsFontSizeToFit>
          {word}
        </Text>
      </View>
    </View>
  </View>
);

export default Word;
