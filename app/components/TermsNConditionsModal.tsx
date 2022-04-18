import React, { useEffect, useState } from 'react'
import ModalContainer from 'components/ModalContainer'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Linking, StyleSheet } from 'react-native'
import CheckBoxSVG from 'components/svg/CheckBoxSVG'
import CheckBoxEmptySVG from 'components/svg/CheckBoxEmptySVG'
import { useNavigation } from '@react-navigation/native'

interface Props {
  onNext: () => void
  onReject: () => void
}

const TermsNConditionsModal = ({ onNext, onReject }: Props) => {
  const { theme, repo } = useApplicationContext()
  const [touChecked, setTouChecked] = useState(false)
  const [ppChecked, setPpChecked] = useState(false)
  const nextBtnEnabled = touChecked && ppChecked
  const { addListener, removeListener } = useNavigation()

  useEffect(captureBackEventFx, [])

  function captureBackEventFx() {
    const callback = (e: {
      data: { action: { type: string } }
      preventDefault: () => void
    }) => {
      if (e.data.action.type === 'GO_BACK') {
        e.preventDefault()
        onReject()
      }
    }
    addListener('beforeRemove', callback)
    return () => removeListener('beforeRemove', callback)
  }

  // After setting pin and/or biometry we store that data immediately.
  // Because of that, user can kill app when shown this screen and on next start
  // he would be able to enter app without consent to Terms n Conditions.
  // To prevent this, we set 'ConsentToTOU&PP' to repo and check that on app startup.
  function saveConsentAndProceed() {
    repo.userSettingsRepo.setSetting('ConsentToTOU&PP', true)
    onNext()
  }

  function openTermsOfUse() {
    Linking.openURL('https://wallet.avax.network/legal?core').catch(
      () => undefined
    )
  }

  function openPrivacyPolicy() {
    Linking.openURL('https://wallet.avax.network/legal?coreToS').catch(
      () => undefined
    )
  }

  function toggleTou() {
    setTouChecked(prevState => !prevState)
  }

  function togglePP() {
    setPpChecked(prevState => !prevState)
  }

  return (
    <ModalContainer containerStyle={{ padding: 16 }}>
      <AvaText.Heading2 textStyle={{ marginTop: 8, textAlign: 'center' }}>
        Terms & Conditions
      </AvaText.Heading2>
      <AvaText.Body2 textStyle={{ textAlign: 'center', marginTop: 16 }}>
        To use Core please read and agree to the terms below.
      </AvaText.Body2>
      <Space y={32} />
      <Row style={styles.row}>
        <AvaButton.Icon onPress={toggleTou} style={styles.checkmark}>
          {touChecked ? <CheckBoxSVG /> : <CheckBoxEmptySVG />}
        </AvaButton.Icon>
        <Space x={20} />
        <AvaText.Body1 textStyle={{ flex: 1 }}>
          {'I agree to the '}
          <AvaText.Heading3
            textStyle={{ color: theme.colorPrimary1 }}
            onPress={openTermsOfUse}>
            Terms of Use
          </AvaText.Heading3>
        </AvaText.Body1>
      </Row>
      <Row style={styles.row}>
        <AvaButton.Icon onPress={togglePP} style={styles.checkmark}>
          {ppChecked ? <CheckBoxSVG /> : <CheckBoxEmptySVG />}
        </AvaButton.Icon>
        <Space x={20} />
        <AvaText.Body1 textStyle={{ flex: 1 }}>
          {'I acknowledge the '}
          <AvaText.Heading3
            textStyle={{ color: theme.colorPrimary1 }}
            onPress={openPrivacyPolicy}>
            Privacy Policy
          </AvaText.Heading3>
        </AvaText.Body1>
      </Row>
      <AvaButton.PrimaryLarge
        style={{ marginTop: 28 }}
        onPress={saveConsentAndProceed}
        disabled={!nextBtnEnabled}>
        Next
      </AvaButton.PrimaryLarge>
    </ModalContainer>
  )
}

const styles = StyleSheet.create({
  checkmark: {
    marginHorizontal: -8
  },
  row: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginVertical: -8
  }
})

export default TermsNConditionsModal
