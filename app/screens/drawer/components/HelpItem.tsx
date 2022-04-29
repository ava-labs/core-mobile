import React from 'react'
import AvaListItem from 'components/AvaListItem'
import CarrotSVG from 'components/svg/CarrotSVG'
import useInAppBrowser from 'hooks/useInAppBrowser'

const HELP_URL = 'https://support.avax.network/en/'

const HelpItem = () => {
  const { openUrl } = useInAppBrowser()
  return (
    <AvaListItem.Base
      title={'Help Center'}
      titleAlignment={'flex-start'}
      leftComponent={null}
      rightComponent={<CarrotSVG />}
      rightComponentVerticalAlignment={'center'}
      onPress={() => {
        openUrl(HELP_URL)
      }}
    />
  )
}

export default HelpItem
