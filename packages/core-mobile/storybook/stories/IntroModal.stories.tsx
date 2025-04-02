import React from 'react'
import { useTheme } from '@avalabs/k2-mobile'
import IntroModal from 'screens/onboarding/IntroModal'
import { ViewOnceKey } from 'store/viewOnce'
import WalletConnectSVG from 'components/svg/WalletConnectSVG'
import CoreLogo from 'assets/icons/core.svg'
import RocketLaunch from 'assets/icons/rocket_launch.svg'
import SearchIcon from 'assets/icons/search.svg'

export default {
  title: 'Browser/IntroScreen'
}

export const Basic = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const descriptions = [
    {
      icon: <SearchIcon />,
      text: 'Search for a website or browse suggested apps'
    },
    {
      icon: <WalletConnectSVG color={colors.$neutral50} />,
      text: 'On the website find “Connect” then tap Wallet Connect'
    },
    {
      icon: <CoreLogo width={24} height={24} />,
      text: 'Find Core and tap “Connect”'
    },
    {
      icon: <RocketLaunch />,
      text: 'Conquer the cryptoverse!'
    }
  ]
  return (
    <IntroModal
      heading="How to use the Core Browser..."
      viewOnceKey={ViewOnceKey.BROWSER_INTERACTION}
      buttonText="Get Started"
      descriptions={descriptions}
    />
  )
}
