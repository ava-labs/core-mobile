import React from 'react';
import {Text, View} from 'react-native';

import {SENTENCE_HEIGHT} from '../Layout';
import {PHRASE_STATUS} from '../SortableWord';

interface PhraseContainerProps {
  phraseStatus?: PHRASE_STATUS;
}
const PhraseContainer = ({phraseStatus}: PhraseContainerProps) => {
  const getBorderColor = () => {
    switch (phraseStatus) {
      case PHRASE_STATUS.SOME_WORDS:
        return '#934AF6';
      case PHRASE_STATUS.INVALID_PHRASE:
        return '#FF4562';
      case PHRASE_STATUS.VALID_PHRASE:
        return 'green';
      default:
        return '#6C6C6E';
    }
  };

  return (
    <>
      <View
        style={[
          [], //StyleSheet.absoluteFill,
          {
            backgroundColor:
              phraseStatus === PHRASE_STATUS.NO_WORDS ? '#1A1A1C' : '#000',
            borderWidth: 1,
            borderColor: getBorderColor(),
            borderRadius: 5,
            height: SENTENCE_HEIGHT,
          },
        ]}
      />
      {phraseStatus === PHRASE_STATUS.INVALID_PHRASE && (
        <Text style={{color: '#FF4562'}}>
          Incorrect recovery phrase. Please try again!
        </Text>
      )}
    </>
  );
};

export default PhraseContainer;
