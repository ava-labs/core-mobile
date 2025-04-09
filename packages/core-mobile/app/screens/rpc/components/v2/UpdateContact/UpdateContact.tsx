import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectContact } from 'store/addressBook'
import { showSimpleToast } from 'components/Snackbar'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useRoute } from '@react-navigation/native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'

type UpdateContactScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.UpdateContactV2
>

const UpdateContact = (): JSX.Element => {
  // const { goBack } = useNavigation<UpdateContactScreenProps['navigation']>()

  const { request, contact } =
    useRoute<UpdateContactScreenProps['route']>().params

  const { onUserRejected: onReject } = useDappConnectionV2()

  // const peerMeta = request.peerMeta

  const existingContact = useSelector(selectContact(contact.id))

  useEffect(() => {
    if (!existingContact) {
      showSimpleToast(
        `Ooops, seems the contact you're updating is not in address book.`
      )
      onReject(request)
    }
  }, [existingContact, onReject, request])

  // const rejectAndClose = useCallback(() => {
  //   onReject(request)
  //   goBack()
  // }, [goBack, onReject, request])

  // const approveAndClose = useCallback(() => {
  //   onApprove(request, { contact })
  //   goBack()
  // }, [contact, goBack, onApprove, request])

  return <></>
  // <UpdateContactView
  //   onApprove={approveAndClose}
  //   onReject={rejectAndClose}
  //   dappUrl={peerMeta.url}
  //   existingContact={existingContact}
  //   contact={contact}
  // />
}

export default UpdateContact
