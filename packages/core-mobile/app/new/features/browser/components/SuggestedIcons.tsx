import React from 'react'
import { Image, SxProp } from '@avalabs/k2-alpine'
import { SuggestedSiteName } from 'store/browser/const'

export const SuggestedSiteIcon = ({
  name,
  sx
}: {
  name: SuggestedSiteName
  sx?: SxProp
}): JSX.Element => {
  switch (name) {
    case SuggestedSiteName.LFJ:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/traderjoe.png')}
          sx={sx}
        />
      )
    case SuggestedSiteName.YIELD_YAK:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/yieldyak.png')}
          sx={sx}
        />
      )
    case SuggestedSiteName.GMX:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/gmx.png')}
          sx={sx}
        />
      )
    case SuggestedSiteName.AAVE:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/aave.png')}
          sx={sx}
        />
      )
    case SuggestedSiteName.GOGOPOOL:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/ggp.png')}
          sx={sx}
        />
      )
    case SuggestedSiteName.SALVOR:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/salvor.png')}
          sx={sx}
        />
      )
    case SuggestedSiteName.DELTA_PRIME:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/deltaprime.png')}
          sx={sx}
        />
      )
    case SuggestedSiteName.THE_ARENA:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/arena.png')}
          sx={sx}
        />
      )
    case SuggestedSiteName.STEAKHUT:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/steakhut.png')}
          sx={sx}
        />
      )
    case SuggestedSiteName.PHARAOH:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/pharaoh.png')}
          sx={sx}
        />
      )
    case SuggestedSiteName.PANGOLIN:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/pango.png')}
          sx={sx}
        />
      )
    case SuggestedSiteName.BENQI:
      return (
        <Image
          source={require('assets/icons/browser_suggested_icons/benqi.png')}
          sx={sx}
        />
      )
  }
}
