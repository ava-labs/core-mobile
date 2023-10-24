import React, { Dispatch, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity10 } from 'resources/Constants'

type Props = {
  wordIndex: number
  wordOptions: string[]
  testID?: string
  setSelectedWord: Dispatch<string>
}

export default function WordSelection({
  wordIndex,
  wordOptions,
  setSelectedWord
}: Props): JSX.Element {
  const [selectedWordIndex, setSelectedWordIndex] = useState(-1)

  const onSelection = (word: string, index: number) => {
    setSelectedWord(word)
    setSelectedWordIndex(index)
  }

  const [word0, word1, word2] = [
    wordOptions[0] ?? '',
    wordOptions[1] ?? '',
    wordOptions[2] ?? ''
  ]

  return (
    <>
      <AvaText.Heading3 testID="word_selection__word_number">
        Select word #{wordIndex + 1}
      </AvaText.Heading3>
      <Space y={16} />
      <View style={styles.horizontalLayout}>
        <Word
          testID="word_selection__word_one"
          selected={selectedWordIndex === 0}
          word={word0}
          onSelected={word => onSelection(word, 0)}
        />
        <Space x={16} />
        <Word
          testID="word_selection__word_two"
          selected={selectedWordIndex === 1}
          word={word1}
          onSelected={word => onSelection(word, 1)}
        />
        <Space x={16} />
        <Word
          testID="word_selection__word_three"
          selected={selectedWordIndex === 2}
          word={word2}
          onSelected={word => onSelection(word, 2)}
        />
      </View>
    </>
  )
}

function Word({
  word,
  onSelected,
  selected
}: {
  word: string
  onSelected: (word: string) => void
  selected: boolean
  testID?: string
}) {
  const { theme, isDarkMode } = useApplicationContext()
  //until designers fix the design system we'll bear with this
  const bgColor = isDarkMode ? theme.white + Opacity10 : theme.colorBg1
  const colorSelected = isDarkMode ? theme.alternateBackground : theme.colorBg3
  const textColor = theme.colorText1
  const textColorSelected = theme.colorBg2
  return (
    <View style={{ flexGrow: 1 }}>
      <AvaButton.Base
        testID="word_selection__select_word_button"
        onPress={() => onSelected(word)}
        style={{
          backgroundColor: selected ? colorSelected : bgColor,
          borderRadius: 8,
          alignItems: 'center',
          padding: 12
        }}>
        <AvaText.ButtonMedium
          testID="word_selection__select_word_text"
          textStyle={{ color: selected ? textColorSelected : textColor }}>
          {word}
        </AvaText.ButtonMedium>
      </AvaButton.Base>
    </View>
  )
}

const styles = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
})
