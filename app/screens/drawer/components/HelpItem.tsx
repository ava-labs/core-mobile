import React from 'react'
import AvaListItem from 'components/AvaListItem'
import useInAppBrowser from 'hooks/useInAppBrowser'

const HELP_URL = 'https://support.avax.network/en/'

const HelpItem = () => {
  const { openUrl } = useInAppBrowser()
  return (
    <AvaListItem.Base
      title={'Help Center'}
      onPress={() => {
        openUrl(HELP_URL)
      }}
    />
  )
}

export default HelpItem
