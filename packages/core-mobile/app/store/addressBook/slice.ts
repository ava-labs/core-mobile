import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import {
  AddressBookState,
  ContactCollection,
  RecentContact,
  UID
} from 'store/addressBook/types'
import { Contact } from '@avalabs/types'

const reducerName = 'addressBook'

const initialState = {
  contacts: {},
  recentContacts: [],
  editingContact: undefined
} as AddressBookState

const addressBookSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addContact: (state, action: PayloadAction<Contact>) => {
      const newContact = action.payload
      state.contacts[newContact.id] = newContact
    },
    removeContact: (state, action: PayloadAction<UID>) => {
      const uid = action.payload
      delete state.contacts[uid]
    },
    addRecentContact: (state, action: PayloadAction<RecentContact>) => {
      const newContact = action.payload
      state.recentContacts = [
        newContact,
        ...state.recentContacts.filter(value => value.id !== newContact.id)
      ].slice(0, 9) //save max 10 recents
    },
    setEditingContact: (state, action: PayloadAction<Contact | undefined>) => {
      state.editingContact = action.payload
    },
    saveEditingContact: state => {
      if (state.editingContact) {
        state.contacts[state.editingContact.id] = state.editingContact
      }
    }
  }
})

// selectors
export const selectContacts = (state: RootState): ContactCollection =>
  state.addressBook.contacts
export const selectContact = (uid: UID) => (state: RootState) => {
  return state.addressBook.contacts[uid]
}
export const selectRecentContacts = (state: RootState): RecentContact[] =>
  state.addressBook.recentContacts
export const selectEditingContact = (state: RootState): Contact | undefined =>
  state.addressBook.editingContact

// actions
export const {
  addRecentContact,
  addContact,
  removeContact,
  setEditingContact,
  saveEditingContact
} = addressBookSlice.actions

export const addressBookReducer = addressBookSlice.reducer
