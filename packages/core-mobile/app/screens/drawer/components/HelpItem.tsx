import React from 'react'
import AvaListItem from 'components/AvaListItem'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { useAnalytics } from 'hooks/useAnalytics'

const HELP_URL = 'https://support.avax.network/en/'

const HelpItem = (): JSX.Element => {
  const { openUrl } = useInAppBrowser()
  const { capture } = useAnalytics()

  return (
    <AvaListItem.Base
      testID="help_item__help_center_button"
      title={'Help Center'}
      onPress={() => {
        capture('HelpCenterClicked')
        openUrl(HELP_URL)
      }}
    />
  )
}

export default HelpItem
