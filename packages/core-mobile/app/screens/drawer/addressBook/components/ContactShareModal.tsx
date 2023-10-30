import React, { useCallback, useState } from 'react'
import ModalContainer from 'components/ModalContainer'
import AvaText from 'components/AvaText'
import {
  RemoveEvents,
  useBeforeRemoveListener
} from 'hooks/useBeforeRemoveListener'
import { titleToInitials } from 'utils/Utils'
import BlockchainCircle from 'components/BlockchainCircle'
import CheckBoxEmptySVG from 'components/svg/CheckBoxEmptySVG'
import CheckBoxSVG from 'components/svg/CheckBoxSVG'
import { Row } from 'components/Row'
import { View } from 'react-native'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { Contact } from 'store/addressBook'

interface Props {
  contact: Contact
  onContinue: (
    contactName: string,
    cChainAddress?: string,
    btcAddress?: string
  ) => void
  onCancel: () => void
}

const ContactShareModal = ({ contact, onContinue, onCancel }: Props) => {
  const [cChainSelected, setCChainSelected] = useState(true)
  const [btcSelected, setBtcSelected] = useState(true)

  useBeforeRemoveListener(onCancel, [RemoveEvents.GO_BACK], true)

  const handleContinue = useCallback(() => {
    onContinue(
      contact.title,
      cChainSelected ? contact.address : undefined,
      btcSelected ? contact.addressBtc : undefined
    )
  }, [
    btcSelected,
    cChainSelected,
    contact.address,
    contact.addressBtc,
    contact.title,
    onContinue
  ])
  return (
    <ModalContainer containerStyle={{ padding: 24 }}>
      <AvaText.Heading2 textStyle={{ marginTop: 8, textAlign: 'center' }}>
        Share contact
      </AvaText.Heading2>
      <Space y={24} />
      <View style={{ alignItems: 'center' }}>
        <BlockchainCircle
          size={80}
          textSize={32}
          chain={titleToInitials(contact.title)}
        />
      </View>
      <Space y={35} />

      <AvaButton.Base onPress={() => setCChainSelected(s => !s)}>
        <Row>
          {cChainSelected ? <CheckBoxSVG /> : <CheckBoxEmptySVG />}
          <Space x={11} />
          <View>
            <AvaText.Heading3>{contact.title}</AvaText.Heading3>
            <AvaText.Body1>Avalanche C-Chain Address</AvaText.Body1>
          </View>
        </Row>
      </AvaButton.Base>

      <Space y={27} />

      <AvaButton.Base onPress={() => setBtcSelected(s => !s)}>
        <Row>
          {btcSelected ? <CheckBoxSVG /> : <CheckBoxEmptySVG />}
          <Space x={11} />
          <View>
            <AvaText.Heading3>{contact.title}</AvaText.Heading3>
            <AvaText.Body1>Bitcoin Address</AvaText.Body1>
          </View>
        </Row>
      </AvaButton.Base>

      <Space y={60} />
      <Row style={{ justifyContent: 'flex-end' }}>
        <AvaButton.TextLarge onPress={onCancel}>Cancel</AvaButton.TextLarge>
        <AvaButton.TextLarge
          disabled={!cChainSelected && !btcSelected}
          onPress={handleContinue}>
          Continue
        </AvaButton.TextLarge>
      </Row>
    </ModalContainer>
  )
}

export default ContactShareModal
