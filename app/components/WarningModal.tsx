import React, { FC } from 'react'
import ModalContainer from 'components/ModalContainer'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'

interface Props {
  onAction?: () => void
  onDismiss?: () => void
  title?: string
  message?: string
  actionText?: string
  dismissText?: string
  testID?: string
}

const WarningModal: FC<Props> = ({
  title,
  message,
  actionText = 'Ok',
  dismissText = 'Back',
  onAction,
  onDismiss
}) => {
  return (
    <ModalContainer>
      <AvaText.Heading2
        textStyle={{ marginTop: 8, textAlign: 'center' }}
        testID="warningModalTitle">
        {title}
      </AvaText.Heading2>
      <AvaText.Body2
        textStyle={{ textAlign: 'center', marginTop: 16 }}
        testID="warningModalMessage">
        {message}
      </AvaText.Body2>
      {onAction && (
        <AvaButton.PrimaryLarge
          style={{ marginTop: 28 }}
          onPress={onAction}
          testID="modalIUnderstandBtn">
          {actionText}
        </AvaButton.PrimaryLarge>
      )}
      {onDismiss && (
        <AvaButton.TextLarge
          style={{ marginTop: 16 }}
          onPress={onDismiss}
          testID="modalBackBtn">
          {dismissText}
        </AvaButton.TextLarge>
      )}
    </ModalContainer>
  )
}

export default WarningModal
