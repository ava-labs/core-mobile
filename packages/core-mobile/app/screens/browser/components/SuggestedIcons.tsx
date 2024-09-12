import React from 'react'
import { Image, SxProp } from '@avalabs/k2-mobile'
import { SuggestedLogo } from 'store/browser/const'

export const SuggestedSiteIcon = ({
  name,
  sx
}: {
  name: SuggestedLogo
  sx?: SxProp
}) => {
  switch (name) {
    case SuggestedLogo.TRADER_JOE:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/traderjoe.png')}
          sx={sx}
        />
      )
    case SuggestedLogo.YIELD_YAK:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/yieldyak.png')}
          sx={sx}
        />
      )
    case SuggestedLogo.GMX:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/gmx.png')}
          sx={sx}
        />
      )
    case SuggestedLogo.AAVE:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/aave.png')}
          sx={sx}
        />
      )
    case SuggestedLogo.GOGOPOOL:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/ggp.png')}
          sx={sx}
        />
      )
    case SuggestedLogo.SALVOR:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/salvor.png')}
          sx={sx}
        />
      )
    case SuggestedLogo.DELTA_PRIME:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/deltaprime.png')}
          sx={sx}
        />
      )
    case SuggestedLogo.THE_ARENA:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/arena.png')}
          sx={sx}
        />
      )
    case SuggestedLogo.STEAKHUT:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/steakhut.png')}
          sx={sx}
        />
      )
    case SuggestedLogo.PHARAOH:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/pharaoh.png')}
          sx={sx}
        />
      )
    case SuggestedLogo.PANGOLIN:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/pango.png')}
          sx={sx}
        />
      )
    case SuggestedLogo.BENQI:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/benqi.png')}
          sx={sx}
        />
      )
  }
}
