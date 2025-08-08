import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  InteractionManager,
  Keyboard,
  NativeSyntheticEvent,
  TextInput
} from 'react-native'
import { Button, Text, useTheme, View } from '@avalabs/k2-alpine'
import * as bip39 from 'bip39'
import { TextInputSelectionChangeEventData } from 'react-native'
import Animated, {
  SequencedTransition,
  ZoomIn,
  ZoomOut
} from 'react-native-reanimated'

export default function RecoveryPhraseInput({
  onChangeText
}: {
  onChangeText: (text: string) => void
}): JSX.Element {
  const { theme } = useTheme()
  const [enteredText, setEnteredText] = useState('')
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [currentWord, setCurrentWord] = useState('')
  const suggestedWords = useMemo(() => {
    if (currentWord.length === 0) {
      return []
    }

    return (bip39.wordlists.EN ?? []).filter(
      word => word.startsWith(currentWord) && word !== currentWord
    )
  }, [currentWord])

  const textInputRef = useRef<TextInput>(null)

  const renderWordSuggestion = ({
    item
  }: {
    item: string
  }): React.ReactElement => {
    return (
      <Animated.View
        entering={ZoomIn.duration(200)}
        exiting={ZoomOut.duration(200)}
        layout={SequencedTransition}>
        <Button
          type="secondary"
          size="medium"
          onPress={() => replaceCurrentWord(item)}
          style={{ marginRight: 8 }}>
          {item}
        </Button>
      </Animated.View>
    )
  }

  const updateCurrentWord = (newText: string, selectionStart: number): void => {
    const leftText = newText.slice(0, selectionStart) // Text before the cursor
    const rightText = newText.slice(selectionStart) // Text after the cursor

    const leftWord = leftText.split(/\s+/).pop() || '' // The word on the left side
    const rightWord = rightText.split(/\s+/)[0] || '' // The word on the right side

    setCurrentWord(leftWord + rightWord) // Update the current word
  }

  const replaceCurrentWord = (replacement: string): void => {
    const leftText = enteredText.slice(0, selection.start) // Text before the current selection
    const rightText = enteredText.slice(selection.end) // Text after the current selection

    // Extract the current word
    const leftWord = leftText.split(/\s+/).pop() || '' // The word on the left side
    const rightWord = rightText.split(/\s+/)[0] || '' // The word on the right side

    const wordEditing = leftWord + rightWord // The word currently being edited

    if (wordEditing) {
      // Construct the updated text
      const beforeWord = leftText.slice(0, -leftWord.length) // Text before the current word
      const afterWord = rightText.slice(rightWord.length) // Text after the current word

      const newText = `${beforeWord}${replacement} ${afterWord}` // New text with the replacement word and a space
      setEnteredText(newText) // Update the text input

      // Place the cursor at the position after the replacement word
      const newCursorPosition = beforeWord.length + replacement.length + 1
      setSelection({ start: newCursorPosition, end: newCursorPosition }) // Update the cursor position
    }
  }

  const handleChangeText = (text: string): void => {
    setEnteredText(text)

    updateCurrentWord(text, selection.start)
  }

  const handleSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>
  ): void => {
    setSelection(e.nativeEvent.selection)
  }

  const handleSubmitEditing = (): void => {
    Keyboard.dismiss()
  }

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      textInputRef.current?.focus()
    })
  }, [textInputRef])

  useEffect(() => {
    onChangeText(enteredText)
  }, [enteredText, onChangeText])

  const decoratedText = useMemo(() => {
    const textArray = enteredText.split(/\s+/)

    return textArray.map((word, index) => {
      const isValid = (bip39.wordlists.EN ?? []).some(
        wordInList =>
          wordInList === word ||
          (word === currentWord && wordInList.startsWith(word))
      )

      const color = isValid
        ? theme.colors.$textPrimary
        : theme.colors.$textDanger

      return (
        <Text
          key={`${color}-${index}`}
          style={{
            ...TEXT_STYLE,
            color
          }}>
          {word}
          {index < textArray.length - 1 ? ' ' : ''}
        </Text>
      )
    })
  }, [enteredText, theme, currentWord])

  return (
    <View sx={{ gap: 10 }}>
      <View
        sx={{
          backgroundColor: '$surfaceSecondary',
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          minHeight: 150
        }}>
        <TextInput
          autoCapitalize={'none'}
          ref={textInputRef}
          autoCorrect={false}
          allowFontScaling={false}
          returnKeyType="done"
          selectionColor={theme.colors.$textPrimary}
          spellCheck
          multiline
          onChangeText={handleChangeText}
          onSelectionChange={handleSelectionChange}
          blurOnSubmit
          onSubmitEditing={handleSubmitEditing}
          style={{
            flexGrow: 1,
            textAlignVertical: 'top',
            color: theme.colors.$textPrimary,
            ...TEXT_STYLE
          }}
          testID="text_area__recovery_phrase">
          {decoratedText}
        </TextInput>
      </View>
      <FlatList
        style={{ overflow: 'visible' }}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={suggestedWords}
        renderItem={renderWordSuggestion}
        keyboardShouldPersistTaps="always"
      />
    </View>
  )
}

const TEXT_STYLE = {
  fontSize: 16,
  lineHeight: 24,
  fontFamily: 'Inter-Regular'
}
