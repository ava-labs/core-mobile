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
  testID,
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
      <Text variant="subtitle1" testID={`${testID}_title`}>
        {title ?? ' '}
      </Text>
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 8
        }}>
        <Word
          testID={`${testID}_${word0}`}
          selected={selectedWordIndex === 0}
          word={word0}
          onSelected={word => onSelection(word, 0)}
        />
        <Word
          testID={`${testID}_${word1}`}
          selected={selectedWordIndex === 1}
          word={word1}
          onSelected={word => onSelection(word, 1)}
        />
        <Word
          testID={`${testID}_${word2}`}
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
    <View style={{ flexGrow: 1 }}>
      <Button
        testID={testID}
        type={selected ? 'primary' : 'secondary'}
        size="large"
        onPress={() => onSelected(word)}>
        {word}
      </Button>
    </View>
  )
}
