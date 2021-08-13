import React from 'react';
import {StyleSheet, View} from 'react-native';

import {SENTENCE_HEIGHT} from '../Layout';

const PhraseContainer = ({ isValidPhrase }: boolean) => {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: '#1A1A1C',
          borderWidth: 1,
          borderColor: isValidPhrase ? '#6C6C6E' : 'red',
          borderRadius: 5,
          height: SENTENCE_HEIGHT,
        },
      ]}
    />
  );
};

export default PhraseContainer;
