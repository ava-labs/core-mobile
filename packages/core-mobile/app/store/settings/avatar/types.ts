import { ImageSourcePropType } from 'react-native'

export type AvatarType = {
  id: string
  source: ImageSourcePropType
}

export const AVATARS: AvatarType[] = [
  require('assets/avatars/abstract-1.png'),
  require('assets/avatars/abstract-2.png'),
  require('assets/avatars/abstract-3.png'),
  require('assets/avatars/abstract-4.png'),
  require('assets/avatars/abstract-5.png'),
  require('assets/avatars/art-1.png'),
  require('assets/avatars/art-2.png'),
  require('assets/avatars/art-3.png'),
  require('assets/avatars/art-4.png'),
  require('assets/avatars/art-5.png'),
  require('assets/avatars/art-6.png'),
  require('assets/avatars/art-7.png'),
  require('assets/avatars/art-8.png'),
  require('assets/avatars/art-9.png'),
  require('assets/avatars/art-10.png'),
  require('assets/avatars/coin-1.png'),
  require('assets/avatars/coin-2.png'),
  require('assets/avatars/coin-3.png'),
  require('assets/avatars/coin-4.png'),
  require('assets/avatars/coin-5.png'),
  require('assets/avatars/coin-6.png'),
  require('assets/avatars/coin-7.png'),
  require('assets/avatars/cub-1.png'),
  require('assets/avatars/cub-2.png'),
  require('assets/avatars/cub-3.png'),
  require('assets/avatars/cub-4.png'),
  require('assets/avatars/cub-5.png'),
  require('assets/avatars/cub-6.png'),
  require('assets/avatars/cub-7.png'),
  require('assets/avatars/cub-8.png'),
  require('assets/avatars/cub-9.png'),
  require('assets/avatars/cub-10.png'),
  require('assets/avatars/cub-11.png'),
  require('assets/avatars/cub-13.png'),
  require('assets/avatars/cub-14.png'),
  require('assets/avatars/cub-15.png'),
  require('assets/avatars/cub-16.png'),
  require('assets/avatars/cub-17.png'),
  require('assets/avatars/cub-18.png'),
  require('assets/avatars/cub-19.png'),
  require('assets/avatars/cub-21.png'),
  require('assets/avatars/cub-22.png'),
  require('assets/avatars/cub-23.png'),
  require('assets/avatars/cub-24.png'),
  require('assets/avatars/cub-25.png'),
  require('assets/avatars/cub-26.png'),
  require('assets/avatars/cub-27.png'),
  require('assets/avatars/cub-28.png'),
  require('assets/avatars/cub-29.png'),
  require('assets/avatars/cub-30.png'),
  require('assets/avatars/cub-31.png'),
  require('assets/avatars/cub-33.png'),
  require('assets/avatars/cub-34.png'),
  require('assets/avatars/cub-35.png')
].map((avatar, index) => {
  return { id: index.toString(), source: avatar }
})

export const DEFAULT_AVATAR = {
  id: 'DEFAULT',
  source: require('assets/avatars/art-7.png')
}

export const initialState: AvatarState = {
  selected:
    AVATARS[Math.floor(Math.random() * AVATARS.length)] ?? DEFAULT_AVATAR
}

export type AvatarState = {
  selected: AvatarType
}
