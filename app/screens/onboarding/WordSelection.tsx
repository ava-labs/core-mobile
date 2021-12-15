import React, {Dispatch, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import AvaButton from 'components/AvaButton';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Opacity10, Opacity50} from 'resources/Constants';

type Props = {
  wordIndex: number;
  wordOptions: string[];
  setSelectedWord: Dispatch<string>;
};

export default function WordSelection({
  wordIndex,
  wordOptions,
  setSelectedWord,
}: Props): JSX.Element {
  const [selectedWordIndex, setSelectedWordIndex] = useState(-1);

  const onSelection = (word: string, index: number) => {
    setSelectedWord(word);
    setSelectedWordIndex(index);
  };

  return (
    <>
      <AvaText.Heading3>Select word #{wordIndex + 1}</AvaText.Heading3>
      <Space y={16} />
      <View style={styles.horizontalLayout}>
        <Word
          selected={selectedWordIndex === 0}
          word={wordOptions[0]}
          onSelected={word => onSelection(word, 0)}
        />
        <Space x={16} />
        <Word
          selected={selectedWordIndex === 1}
          word={wordOptions[1]}
          onSelected={word => onSelection(word, 1)}
        />
        <Space x={16} />
        <Word
          selected={selectedWordIndex === 2}
          word={wordOptions[2]}
          onSelected={word => onSelection(word, 2)}
        />
      </View>
    </>
  );
}

function Word({
  word,
  onSelected,
  selected,
}: {
  word: string;
  onSelected: (word: string) => void;
  selected: boolean;
}) {
  const {theme, isDarkMode} = useApplicationContext();
  //until designers fix the design system we'll bear with this
  const bgColor = isDarkMode ? theme.white + Opacity10 : theme.colorBg1;
  const colorSelected = isDarkMode ? theme.white + Opacity50 : theme.colorBg3;
  return (
    <View style={{flexGrow: 1}}>
      <AvaButton.Base
        onPress={() => onSelected(word)}
        style={{
          backgroundColor: selected ? colorSelected : bgColor,
          borderRadius: 8,
          alignItems: 'center',
          padding: 12,
        }}>
        <AvaText.ButtonMedium textStyle={{color: theme.colorText1}}>
          {word}
        </AvaText.ButtonMedium>
      </AvaButton.Base>
    </View>
  );
}

const styles: any = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
