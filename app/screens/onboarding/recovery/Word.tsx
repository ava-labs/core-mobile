import React, {useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {WORD_HEIGHT} from './Layout';
import {ApplicationContext} from 'contexts/ApplicationContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#E8E6E8',
    borderRadius: 10,
    borderWidth: 1,
    height: WORD_HEIGHT - 8,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  containerDark: {
    backgroundColor: 'black',
  },
  root: {
    padding: 4,
  },
  text: {
    color: 'black',
    fontSize: 16,
  },
  textDark: {
    color: 'white',
  },
});

interface WordProps {
  id: number;
  word: string;
}

const Word = ({word}: WordProps) => {
  const context = useContext(ApplicationContext);
  return (
    <View style={styles.root}>
      <View>
        <View
          style={[
            styles.container,
            context.isDarkMode && styles.containerDark,
          ]}>
          <Text
            style={[styles.text, context.isDarkMode && styles.textDark]}
            adjustsFontSizeToFit>
            {word}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Word;
