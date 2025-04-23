import { AvatarType } from '@avalabs/k2-alpine'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { AVATARS, initialState } from './types'

const reducerName = 'avatar'

export const avatarSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setSelectedAvatar: (state, action: PayloadAction<AvatarType>) => {
      state.selected = action.payload
    }
  }
})

// selectors
export const selectSelectedAvatar = (state: RootState): AvatarType => {
  const selectedAvatar = state.settings.avatar.selected
  const foundAvatar = AVATARS.find(avatar => avatar.id === selectedAvatar?.id)

  if (foundAvatar) {
    return foundAvatar
  }

  return selectedAvatar
}

// actions
export const { setSelectedAvatar } = avatarSlice.actions

export const avatarReducer = avatarSlice.reducer
