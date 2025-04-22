import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAccounts } from 'store/account'
import {
  AddrBookItemType,
  Contact,
  selectContacts,
  selectRecentContacts
} from 'store/addressBook'

export const useContacts = (
  onlyBtc = false
): {
  recentAddresses: Contact[]
  accounts: Contact[]
  contacts: Contact[]
} => {
  const selectedRecentContacts = useSelector(selectRecentContacts)
  const accountCollection = useSelector(selectAccounts)
  const accounts = useMemo(
    () =>
      Object.values(accountCollection).map(
        account =>
          ({
            id: account.index.toString(),
            name: account.name,
            address: account.addressC,
            addressBTC: account.addressBTC,
            addressXP: account.addressPVM.replace(/^[PX]-/, ''),
            avatar: '', // TODO: replace with actual avatar
            type: 'account'
          } as Contact)
      ),
    [accountCollection]
  )
  const contactCollection = useSelector(selectContacts)
  const contacts = useMemo(() => {
    return Object.values(contactCollection).map(contact => {
      return {
        ...contact,
        avatar: '', // TODO: replace with actual avatar
        type: 'contact'
      } as Contact
    })
  }, [contactCollection])

  const recentAddresses = useMemo(
    () =>
      selectedRecentContacts
        .reduce(
          (acc, recentContact) => {
            switch (recentContact.type) {
              case 'account': {
                const account = accounts.find(
                  acct => acct.id === recentContact.id
                )
                if (account) {
                  acc.push({ item: account, type: recentContact.type })
                }
                break
              }
              case 'contact': {
                const contact = contactCollection[recentContact.id]
                if (contact) {
                  acc.push({
                    item: contact,
                    type: recentContact.type
                  })
                }
                break
              }
            }

            return acc
          },
          [] as {
            item: Contact
            type: AddrBookItemType
          }[]
        )
        .filter(
          value =>
            (onlyBtc && value.type === 'contact' && value.item.addressBTC) ||
            (onlyBtc && value.type === 'account') ||
            !onlyBtc
        )
        .map(value => {
          return value.item as Contact
        }),
    [selectedRecentContacts, accounts, contactCollection, onlyBtc]
  )

  // const recentAccounts = useMemo(
  //   () =>
  //     recentAddresses
  //       .filter(value => value.type === 'account')
  //       .map(value => {
  //         const account = value.item as Account
  //         return {
  //           id: value.item.id,
  //           name: value.item.name,
  //           address: account.addressC,
  //           addressBTC: account.addressBTC,
  //           addressXP: account.addressPVM.replace(/^[PX]-/, ''),
  //           avatar: '' // TODO: replace with actual avatar
  //         }
  //       }),
  //   [recentAddresses]
  // )

  // // if there is no recent contact, return the default contact
  // const recentContacts = useMemo(() => {
  //   const recentContact = recentAddresses.filter(
  //     value => value.type === 'contact'
  //   )
  //   if (recentContact.length > 0) {
  //     return recentContact.map(value => value.item as Contact)
  //   }
  //   return contacts
  // }, [contacts, recentAddresses])

  return {
    recentAddresses,
    contacts,
    accounts
    // recentAccounts,
    // recentContacts
  }
}
