import React, { useCallback } from 'react'
import AddressBookSVG from 'components/svg/AddressBookSVG'
import AddressBookItem from 'components/addressBook/AddressBookItem'
import { capitalizeFirstLetter } from 'utils/string/capitalize'
import { useDappConnectionContext } from 'contexts/DappConnectionContext'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import SimplePrompt from './SimplePrompt'

type ContactPromptScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.CreateRemoveContact
>

const CreateRemoveContact = () => {
  const { goBack } = useNavigation<ContactPromptScreenProps['navigation']>()

  const { request, contact, action } =
    useRoute<ContactPromptScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionContext()

  const {
    payload: { peerMeta }
  } = request

  const header = `${capitalizeFirstLetter('action')} Contact?`

  const description = `${
    new URL(peerMeta?.url ?? '').hostname
  } is requesting to ${action} a
  contact:`

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { contact })
    goBack()
  }, [contact, goBack, onApprove, request])

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
      onApprove={approveAndClose}
      onReject={rejectAndClose}
      header={header}
      description={description}
      renderIcon={renderWalletIcon}
      renderContent={renderContact}
    />
  )
}

export default CreateRemoveContact
