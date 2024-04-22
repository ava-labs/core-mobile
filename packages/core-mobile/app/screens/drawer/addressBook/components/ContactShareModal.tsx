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
import { NameAndAddresses } from 'screens/drawer/addressBook/types'

interface Props {
  contact: Contact
  onContinue: ({
    name,
    cChainAddress,
    pChainAddress,
    btcAddress
  }: NameAndAddresses) => void
  onCancel: () => void
}

const ContactShareModal = ({
  contact,
  onContinue,
  onCancel
}: Props): JSX.Element => {
  const [cChainSelected, setCChainSelected] = useState(true)
  const [pChainSelected, setPChainSelected] = useState(true)
  const [btcSelected, setBtcSelected] = useState(true)

  useBeforeRemoveListener(onCancel, [RemoveEvents.GO_BACK], true)

  const handleContinue = useCallback(() => {
    onContinue({
      name: contact.title,
      cChainAddress: cChainSelected ? contact.address : undefined,
      pChainAddress: pChainSelected ? contact.addressPVM : undefined,
      btcAddress: btcSelected ? contact.addressBtc : undefined
    })
  }, [
    onContinue,
    contact.title,
    contact.address,
    contact.addressPVM,
    contact.addressBtc,
    cChainSelected,
    pChainSelected,
    btcSelected
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

      {contact.address && (
        <>
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
        </>
      )}

      {contact.addressBtc && (
        <>
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
        </>
      )}

      {contact.addressPVM && (
        <>
          <Space y={27} />
          <AvaButton.Base onPress={() => setPChainSelected(s => !s)}>
            <Row>
              {pChainSelected ? <CheckBoxSVG /> : <CheckBoxEmptySVG />}
              <Space x={11} />
              <View>
                <AvaText.Heading3>{contact.title}</AvaText.Heading3>
                <AvaText.Body1>Avalanche P-Chain Address</AvaText.Body1>
              </View>
            </Row>
          </AvaButton.Base>
        </>
      )}

      <Space y={60} />
      <Row style={{ justifyContent: 'flex-end' }}>
        <AvaButton.TextLarge onPress={onCancel}>Cancel</AvaButton.TextLarge>
        <AvaButton.TextLarge
          disabled={!cChainSelected && !btcSelected && !pChainSelected}
          onPress={handleContinue}>
          Continue
        </AvaButton.TextLarge>
      </Row>
    </ModalContainer>
  )
}

export default ContactShareModal
