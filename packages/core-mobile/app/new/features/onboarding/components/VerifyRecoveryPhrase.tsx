import { Button, showAlert } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import WordSelection from 'features/onboarding/components/WordSelection'
import { useCheckMnemonic } from 'features/onboarding/hooks/useCheckMnemonic'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import AnalyticsService from 'services/analytics/AnalyticsService'

export const VerifyRecoveryPhrase = ({
  mnemonic,
  onVerified
}: {
  mnemonic?: string
  onVerified: () => void
}): React.JSX.Element => {
  const mnemonics = useMemo(
    () => (mnemonic ? mnemonic.split(' ') : []),
    [mnemonic]
  )
  const {
    firstWordSelection,
    secondWordSelection,
    thirdWordSelection,
    verify
  } = useCheckMnemonic(mnemonics)

  const [selectedWord1Index, setSelectedWord1Index] = useState<number>()
  const [selectedWord2Index, setSelectedWord2Index] = useState<number>()
  const [selectedWord3Index, setSelectedWord3Index] = useState<number>()

  const canVerify = useMemo(
    () =>
      [selectedWord1Index, selectedWord2Index, selectedWord3Index].every(
        index => index !== undefined
      ),
    [selectedWord1Index, selectedWord2Index, selectedWord3Index]
  )

  const handleNext = useCallback(() => {
    if (
      selectedWord1Index === undefined ||
      selectedWord2Index === undefined ||
      selectedWord3Index === undefined
    ) {
      return
    }

    const selectedWord1 = firstWordSelection.wordOptions[selectedWord1Index]
    const selectedWord2 = secondWordSelection.wordOptions[selectedWord2Index]
    const selectedWord3 = thirdWordSelection.wordOptions[selectedWord3Index]

    if (verify(selectedWord1, selectedWord2, selectedWord3)) {
      AnalyticsService.capture('OnboardingMnemonicVerified')
      onVerified()
    } else {
      showAlert({
        title: 'Invalid phrase',
        description:
          "The words you selected don't match the recovery phrase. The exact order of each word matters. Please try again.",
        buttons: [{ text: 'Dismiss', style: 'cancel' }]
      })
    }
  }, [
    firstWordSelection.wordOptions,
    onVerified,
    secondWordSelection.wordOptions,
    selectedWord1Index,
    selectedWord2Index,
    selectedWord3Index,
    thirdWordSelection.wordOptions,
    verify
  ])

  const getTitleForWordSelection = useCallback(
    (index: number): string | undefined => {
      if (mnemonics.length === 0) {
        return undefined
      }

      const askBefore =
        (index === 0 || Math.random() > 0.5) && index !== mnemonics.length - 1
      if (askBefore) {
        return `What word comes before "${mnemonics[index + 1]}"?`
      }

      return `What word comes after "${mnemonics[index - 1]}"?`
    },
    [mnemonics]
  )

  const [title1, title2, title3] = useMemo(() => {
    return [
      getTitleForWordSelection(firstWordSelection.index),
      getTitleForWordSelection(secondWordSelection.index),
      getTitleForWordSelection(thirdWordSelection.index)
    ]
  }, [
    getTitleForWordSelection,
    firstWordSelection,
    secondWordSelection,
    thirdWordSelection
  ])

  const opacity = useSharedValue(0)
  useEffect(() => {
    opacity.value = mnemonics.length > 0 ? 1 : 0
  }, [mnemonics, opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 300 })
  }))

  useEffect(() => {
    setSelectedWord1Index(undefined)
    setSelectedWord2Index(undefined)
    setSelectedWord3Index(undefined)
  }, [mnemonics])

  const renderFooter = useCallback(() => {
    return (
      <Button
        size="large"
        type="primary"
        disabled={canVerify === false}
        onPress={handleNext}>
        Next
      </Button>
    )
  }, [canVerify, handleNext])

  return (
    <ScrollScreen
      title="Verify your recovery phrase"
      subtitle={`Select the words below to verify your\nrecover phrase`}
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <Animated.View style={[{ gap: 36, marginTop: 66 }, animatedStyle]}>
        <WordSelection
          title={title1}
          testID="firstWord"
          wordIndex={firstWordSelection.index}
          wordOptions={firstWordSelection.wordOptions}
          selectedWordIndex={selectedWord1Index}
          setSelectedWordIndex={setSelectedWord1Index}
        />
        <WordSelection
          title={title2}
          testID="secondWord"
          wordIndex={secondWordSelection.index}
          wordOptions={secondWordSelection.wordOptions}
          selectedWordIndex={selectedWord2Index}
          setSelectedWordIndex={setSelectedWord2Index}
        />
        <WordSelection
          title={title3}
          testID="thirdWord"
          wordIndex={thirdWordSelection.index}
          wordOptions={thirdWordSelection.wordOptions}
          selectedWordIndex={selectedWord3Index}
          setSelectedWordIndex={setSelectedWord3Index}
        />
      </Animated.View>
    </ScrollScreen>
  )
}
