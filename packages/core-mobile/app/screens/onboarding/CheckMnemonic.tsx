import React, { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import WordSelection from 'screens/onboarding/WordSelection'
import { ShowSnackBar } from 'components/Snackbar'
import { useCheckMnemonic } from 'screens/onboarding/useCheckMnemonic'
import FlexSpacer from 'components/FlexSpacer'
import AnalyticsService from 'services/analytics/AnalyticsService'

type Props = {
  onSuccess: () => void
  onBack: () => void
  mnemonic: string
  testID?: string
}

export default function CheckMnemonic(
  props: Props | Readonly<Props>
): JSX.Element {
  const {
    firstWordSelection,
    secondWordSelection,
    thirdWordSelection,
    verify
  } = useCheckMnemonic(props.mnemonic)

  const onVerify = (): void => {
    if (
      [selectedWord1, selectedWord2, selectedWord3].find(value => !value) !==
      undefined
    ) {
      ShowSnackBar('Select all words')
      return
    }

    if (verify(selectedWord1, selectedWord2, selectedWord3)) {
      AnalyticsService.capture('OnboardingMnemonicVerified')
      props.onSuccess()
    } else {
      ShowSnackBar('Incorrect! Try again, please.')
    }
  }

  const [selectedWord1, setSelectedWord1] = useState('')
  const [selectedWord2, setSelectedWord2] = useState('')
  const [selectedWord3, setSelectedWord3] = useState('')

  // useEffect(() => {}, [selectedWord1, selectedWord2, selectedWord3])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AvaText.LargeTitleBold testID="check_mnemonic__title">
        Verify Phrase
      </AvaText.LargeTitleBold>
      <Space y={20} />
      <AvaText.Body1 testID="check_mnemonic__instructions">
        Select the words below to verify your Recovery Phrase.
      </AvaText.Body1>
      <Space y={24} />
      <WordSelection
        testID="check_mnemonic__first_word"
        wordIndex={firstWordSelection.index}
        wordOptions={firstWordSelection.wordOptions}
        setSelectedWord={setSelectedWord1}
      />
      <Space y={24} />
      <WordSelection
        testID="check_mnemonic__second_word"
        wordIndex={secondWordSelection.index}
        wordOptions={secondWordSelection.wordOptions}
        setSelectedWord={setSelectedWord2}
      />
      <Space y={24} />
      <WordSelection
        testID="check_menemonic__third_word"
        wordIndex={thirdWordSelection.index}
        wordOptions={thirdWordSelection.wordOptions}
        setSelectedWord={setSelectedWord3}
      />
      <FlexSpacer minHeight={20} />
      <View style={{ flex: 1 }} />
      <View testID="check_mnemonic__verify_phrase_btn">
        <AvaButton.PrimaryLarge
          onPress={onVerify}
          testID="check_mnemonic__verify_phrase_btn">
          Verify phrase
        </AvaButton.PrimaryLarge>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: '100%',
    paddingHorizontal: 16,
    paddingBottom: 40
  }
})
