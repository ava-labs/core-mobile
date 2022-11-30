import React, { FC } from 'react'
import AddressBookSVG from 'components/svg/AddressBookSVG'
import AddressBookItem from 'components/addressBook/AddressBookItem'
import { capitalizeFirstLetter } from 'utils/string/capitalize'
import { AvalancheCreateContactRequest } from 'store/rpc/handlers/avalanche_createContact'
import { AvalancheRemoveContactRequest } from 'store/rpc/handlers/avalanche_removeContact'
import SimplePrompt from './SimplePrompt'

type Request = AvalancheCreateContactRequest | AvalancheRemoveContactRequest

interface Props {
  dappEvent: Request
  onApprove: (request: Request) => void
  onReject: (request: Request, message?: string) => void
  onClose: (request: Request) => void
  action: 'create' | 'remove'
}

const ContactPrompt: FC<Props> = ({
  dappEvent,
  onApprove,
  onReject,
  onClose,
  action
}) => {
  const {
    contact,
    payload: { peerMeta }
  } = dappEvent

  const header = `${capitalizeFirstLetter(action)} Contact?`

  const description = `${
    new URL(peerMeta?.url ?? '').hostname
  } is requesting to ${action} a
  contact:`

  const renderWalletIcon = () => <AddressBookSVG size={48} />

  const renderContact = () => {
    return (
      <AddressBookItem
        title={contact.name}
        address={contact.address}
        addressBtc={contact.addressBTC}
      />
    )
  }

  return (
    <SimplePrompt
      onApprove={() => onApprove(dappEvent)}
      onReject={() => {
        onReject(dappEvent)
        onClose(dappEvent)
      }}
      header={header}
      description={description}
      renderIcon={renderWalletIcon}
      renderContent={renderContact}
    />
  )
}

export default ContactPrompt
