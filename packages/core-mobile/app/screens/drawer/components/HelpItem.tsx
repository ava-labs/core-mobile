import React from 'react'
import AvaListItem from 'components/AvaListItem'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { usePostCapture } from 'hooks/usePosthogCapture'

const HELP_URL = 'https://support.avax.network/en/'

const HelpItem = () => {
  const { openUrl } = useInAppBrowser()
  const { capture } = usePostCapture()

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
