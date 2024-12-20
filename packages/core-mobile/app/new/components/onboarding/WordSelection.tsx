import React, { Dispatch } from 'react'
import { Button, Text, View } from '@avalabs/k2-alpine'

type Props = {
  title?: string
  wordIndex: number
  wordOptions: string[]
  testID?: string
  selectedWordIndex?: number
  setSelectedWordIndex: Dispatch<number>
}

export default function WordSelection({
  title,
  wordOptions,
  selectedWordIndex,
  setSelectedWordIndex
}: Props): JSX.Element {
  const onSelection = (word: string, index: number): void => {
    setSelectedWordIndex(index)
  }

  const [word0, word1, word2] = [
    wordOptions[0] ?? '',
    wordOptions[1] ?? '',
    wordOptions[2] ?? ''
  ]

  return (
    <View sx={{ gap: 10 }}>
      <Text variant="subtitle1" testID="word_selection__word_number">
        {title ?? ' '}
      </Text>
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 8
        }}>
        <Word
          testID="word_selection__word_one"
          selected={selectedWordIndex === 0}
          word={word0}
          onSelected={word => onSelection(word, 0)}
        />
        <Word
          testID="word_selection__word_two"
          selected={selectedWordIndex === 1}
          word={word1}
          onSelected={word => onSelection(word, 1)}
        />
        <Word
          testID="word_selection__word_three"
          selected={selectedWordIndex === 2}
          word={word2}
          onSelected={word => onSelection(word, 2)}
        />
      </View>
    </View>
  )
}

function Word({
  word,
  onSelected,
  selected,
  testID
}: {
  word: string
  onSelected: (word: string) => void
  selected: boolean
  testID?: string
}): JSX.Element {
  return (
    <View testID={testID} style={{ flexGrow: 1 }}>
      <Button
        testID="word_selection__select_word_button"
        type={selected ? 'primary' : 'secondary'}
        size="large"
        onPress={() => onSelected(word)}>
        {word}
      </Button>
    </View>
  )
}
