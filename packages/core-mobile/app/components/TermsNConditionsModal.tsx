import React from 'react'
import ModalContainer from 'components/ModalContainer'
import { Space } from 'components/Space'
import { Linking } from 'react-native'
import {
  RemoveEvents,
  useBeforeRemoveListener
} from 'hooks/useBeforeRemoveListener'
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from 'resources/Constants'
import { useDispatch } from 'react-redux'
import { setTouAndPpConsent } from 'store/settings/securityPrivacy'
import { Button, Text } from '@avalabs/k2-mobile'
import Logger from 'utils/Logger'
import { usePostCapture } from 'hooks/usePosthogCapture'

interface Props {
  onNext: () => void
  onReject: () => void
}

const openTermsOfUse = (): void => {
  Linking.openURL(TERMS_OF_USE_URL).catch(Logger.error)
}

const openPrivacyPolicy = (): void => {
  Linking.openURL(PRIVACY_POLICY_URL).catch(Logger.error)
}

const TermsNConditionsModal = ({ onNext, onReject }: Props): JSX.Element => {
  const dispatch = useDispatch()
  const { capture } = usePostCapture()

  useBeforeRemoveListener(onReject, [RemoveEvents.GO_BACK], true)

  // After setting pin and/or biometry we store that data immediately.
  // Because of that, user can kill app when shown this screen and on next start
  // he would be able to enter app without consent to Terms n Conditions.
  // To prevent this, we set setTouAndPpConsent to true in redux and check that on app startup.
  const saveConsentAndProceed = (): void => {
    dispatch(setTouAndPpConsent(true))
    onNext()
    capture('TermsAndConditionsAccepted')
  }

  return (
    <ModalContainer containerStyle={{ padding: 16 }}>
      <Text variant="heading5" style={{ marginTop: 8, textAlign: 'center' }}>
        Terms and Conditions
      </Text>
      <Text
        variant="body2"
        style={{ textAlign: 'center', marginTop: 16, marginHorizontal: 20 }}>
        To use Core please read and agree to the
        <Text
          variant="body2"
          sx={{ color: '$blueMain' }}
          onPress={openTermsOfUse}>
          {' Terms of Use '}
        </Text>
        and
        <Text
          variant="body2"
          sx={{ color: '$blueMain' }}
          onPress={openPrivacyPolicy}>
          {' Privacy Policy'}
        </Text>
        .
      </Text>
      <Space y={40} />
      <Button size="xlarge" type="primary" onPress={saveConsentAndProceed}>
        Agree and Continue
      </Button>
      <Space y={10} />
    </ModalContainer>
  )
}

export default TermsNConditionsModal
