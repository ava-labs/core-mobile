import React, { useEffect, useRef, useState } from 'react'
import { InteractionManager, StyleSheet, TextInput, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { Opacity30 } from 'resources/Constants'
import AvaButton from './AvaButton'
import AvaText from './AvaText'

type Props = {
  btnPrimaryText: string
  btnSecondaryText: string
  onBtnPrimary: (text: string) => void
  onBtnSecondary: () => void
  onChangeText: (text: string) => void
  heading?: string
  errorMessage?: string
  autoFocus?: boolean
  autoCorrect?: boolean
}

export default function TextArea(props: Props | Readonly<Props>): JSX.Element {
  const context = useApplicationContext()
  const theme = context.theme
  const [enteredText, setEnteredText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    props.errorMessage
  )

  const [primaryDisabled, setPrimaryDisabled] = useState(true)
  const textInputRef = useRef<TextInput>(null)

  useEffect(() => {
    if (props.autoFocus) {
      InteractionManager.runAfterInteractions(() => {
        textInputRef.current?.focus()
      })
    }
  }, [props.autoFocus, textInputRef])

  useEffect(() => {
    setErrorMessage(props.errorMessage)
  }, [props.errorMessage])

  useEffect(() => {
    if (enteredText) {
      setPrimaryDisabled(false)
    } else {
      setPrimaryDisabled(true)
    }
  }, [enteredText])

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colorBg3 + Opacity30
          }
        ]}>
        {props.heading && (
          <AvaText.Heading2
            textStyle={{ marginBottom: 16 }}
            testID="text_area__recovery_phrase_title">
            Recovery phrase
          </AvaText.Heading2>
        )}
        <TextInput
          autoCapitalize={'none'}
          ref={textInputRef}
          autoCorrect={props?.autoCorrect}
          placeholder={'Enter your recovery phrase'}
          placeholderTextColor={theme.colorDisabled}
          multiline={true}
          value={enteredText}
          onChangeText={text => {
            setEnteredText(text)
            props.onChangeText(text)
          }}
          style={[
            {
              flexGrow: 1,
              textAlignVertical: 'top',
              color: theme.colorText1,
              fontSize: 16,
              padding: 0,
              lineHeight: 24,
              fontFamily: 'Inter-Regular'
            }
          ]}
          testID="text_area__recovery_phrase"
        />
        {errorMessage && (
          <AvaText.Body3
            textStyle={{ color: theme.colorError, marginTop: 4 }}
            testID="text_area__error_message">
            {errorMessage}
          </AvaText.Body3>
        )}
      </View>

      <AvaButton.PrimaryLarge
        disabled={primaryDisabled}
        onPress={() => props.onBtnPrimary(enteredText)}
        testID="text_area__signin_button">
        {props.btnPrimaryText}
      </AvaButton.PrimaryLarge>
      <Space y={8} />
      <AvaButton.TextLarge onPress={props.onBtnSecondary}>
        {props.btnSecondaryText}
      </AvaButton.TextLarge>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
    minHeight: 160,
    marginBottom: 24
  },
  buttonContainer: {
    margin: 0,
    padding: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
})
