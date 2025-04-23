import { ImageSourcePropType } from 'react-native'
import { SvgProps } from 'react-native-svg'
export type AvatarType = {
  id: string
  source: ImageSourcePropType | React.FC<SvgProps>
}

import Abstract1 from 'assets/avatars/abstract-1.svg'
import Abstract2 from 'assets/avatars/abstract-2.svg'
import Abstract3 from 'assets/avatars/abstract-3.svg'
import Abstract4 from 'assets/avatars/abstract-4.svg'
import Abstract5 from 'assets/avatars/abstract-5.svg'
import Art1 from 'assets/avatars/art-1.svg'
import Art10 from 'assets/avatars/art-10.svg'
import Art2 from 'assets/avatars/art-2.svg'
import Art3 from 'assets/avatars/art-3.svg'
import Art4 from 'assets/avatars/art-4.svg'
import Art5 from 'assets/avatars/art-5.svg'
import Art6 from 'assets/avatars/art-6.svg'
import Art7 from 'assets/avatars/art-7.svg'
import Art8 from 'assets/avatars/art-8.svg'
import Art9 from 'assets/avatars/art-9.svg'
import Coin1 from 'assets/avatars/coin-1.svg'
import Coin2 from 'assets/avatars/coin-2.svg'
import Coin3 from 'assets/avatars/coin-3.svg'
import Coin4 from 'assets/avatars/coin-4.svg'
import Coin5 from 'assets/avatars/coin-5.svg'
import Coin6 from 'assets/avatars/coin-6.svg'
import Coin7 from 'assets/avatars/coin-7.svg'
import Cub1 from 'assets/avatars/cub-1.svg'
import Cub10 from 'assets/avatars/cub-10.svg'
import Cub11 from 'assets/avatars/cub-11.svg'
import Cub13 from 'assets/avatars/cub-13.svg'
import Cub14 from 'assets/avatars/cub-14.svg'
import Cub15 from 'assets/avatars/cub-15.svg'
import Cub16 from 'assets/avatars/cub-16.svg'
import Cub17 from 'assets/avatars/cub-17.svg'
import Cub18 from 'assets/avatars/cub-18.svg'
import Cub19 from 'assets/avatars/cub-19.svg'
import Cub2 from 'assets/avatars/cub-2.svg'
import Cub21 from 'assets/avatars/cub-21.svg'
import Cub22 from 'assets/avatars/cub-22.svg'
import Cub23 from 'assets/avatars/cub-23.svg'
import Cub24 from 'assets/avatars/cub-24.svg'
import Cub25 from 'assets/avatars/cub-25.svg'
import Cub26 from 'assets/avatars/cub-26.svg'
import Cub27 from 'assets/avatars/cub-27.svg'
import Cub28 from 'assets/avatars/cub-28.svg'
import Cub29 from 'assets/avatars/cub-29.svg'
import Cub3 from 'assets/avatars/cub-3.svg'
import Cub30 from 'assets/avatars/cub-30.svg'
import Cub31 from 'assets/avatars/cub-31.svg'
import Cub33 from 'assets/avatars/cub-33.svg'
import Cub34 from 'assets/avatars/cub-34.svg'
import Cub35 from 'assets/avatars/cub-35.svg'
import Cub4 from 'assets/avatars/cub-4.svg'
import Cub5 from 'assets/avatars/cub-5.svg'
import Cub6 from 'assets/avatars/cub-6.svg'
import Cub7 from 'assets/avatars/cub-7.svg'
import Cub8 from 'assets/avatars/cub-8.svg'
import Cub9 from 'assets/avatars/cub-9.svg'
import React from 'react'

const LOCAL_AVATARS = {
  abstract1: Abstract1,
  abstract2: Abstract2,
  abstract3: Abstract3,
  abstract4: Abstract4,
  abstract5: Abstract5,
  art1: Art1,
  art2: Art2,
  art3: Art3,
  art4: Art4,
  art5: Art5,
  art6: Art6,
  art7: Art7,
  art8: Art8,
  art9: Art9,
  art10: Art10,
  coin1: Coin1,
  coin2: Coin2,
  coin3: Coin3,
  coin4: Coin4,
  coin5: Coin5,
  coin6: Coin6,
  coin7: Coin7,
  cub1: Cub1,
  cub2: Cub2,
  cub3: Cub3,
  cub4: Cub4,
  cub5: Cub5,
  cub6: Cub6,
  cub7: Cub7,
  cub8: Cub8,
  cub9: Cub9,
  cub10: Cub10,
  cub11: Cub11,
  cub13: Cub13,
  cub14: Cub14,
  cub15: Cub15,
  cub16: Cub16,
  cub17: Cub17,
  cub18: Cub18,
  cub19: Cub19,
  cub21: Cub21,
  cub22: Cub22,
  cub23: Cub23,
  cub24: Cub24,
  cub25: Cub25,
  cub26: Cub26,
  cub27: Cub27,
  cub28: Cub28,
  cub29: Cub29,
  cub30: Cub30,
  cub31: Cub31,
  cub33: Cub33,
  cub34: Cub34,
  cub35: Cub35
}

export const AVATARS: AvatarType[] = Object.entries(LOCAL_AVATARS).map(
  ([key, value]) => {
    return { id: key, source: value }
  }
)

export const DEFAULT_AVATAR = {
  id: 'DEFAULT',
  source: LOCAL_AVATARS.art7
}

export const initialState: AvatarState = {
  selected: DEFAULT_AVATAR
}

export type AvatarState = {
  selected: AvatarType
}
