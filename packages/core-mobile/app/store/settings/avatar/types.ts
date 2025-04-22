import { ImageSourcePropType } from 'react-native'

export type Avatar = {
  id: string
  source: ImageSourcePropType
}

export const AVATARS: Avatar[] = [
  require('assets/avatars/avatar-1.jpeg'),
  require('assets/avatars/avatar-2.jpeg'),
  require('assets/avatars/avatar-3.jpeg'),
  require('assets/avatars/avatar-4.jpeg'),
  require('assets/avatars/avatar-5.jpeg'),
  require('assets/avatars/avatar-6.png'),
  require('assets/avatars/avatar-7.png'),
  require('assets/avatars/avatar-8.png'),
  require('assets/avatars/avatar-9.jpeg')
].map((avatar, index) => {
  return { id: index.toString(), source: avatar }
})

export const DEFAULT_AVATAR = {
  id: '0',
  source: require('assets/avatars/avatar-1.jpeg')
}

export const initialState: AvatarState = {
  selected: DEFAULT_AVATAR
}

export type AvatarState = {
  selected: Avatar
}
