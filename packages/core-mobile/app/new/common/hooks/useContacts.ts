import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectAccounts } from 'store/account'
import {
  AddrBookItemType,
  Contact,
  selectContacts,
  selectRecentContacts
} from 'store/addressBook'

export const useContacts = (): {
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
        .map(value => {
          return value.item as Contact
        }),
    [selectedRecentContacts, accounts, contactCollection]
  )

  return {
    recentAddresses,
    contacts,
    accounts
  }
}
