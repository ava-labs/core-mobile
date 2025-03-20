import React from 'react'
import AvaListItem from 'components/AvaListItem'
import useInAppBrowser from 'hooks/useInAppBrowser'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { HELP_URL } from 'resources/Constants'

const HelpItem = (): JSX.Element => {
  const { openUrl } = useInAppBrowser()

  return (
    <AvaListItem.Base
      testID="help_item__help_center_button"
      title={'Help Center'}
      onPress={() => {
        AnalyticsService.capture('HelpCenterClicked')
        openUrl(HELP_URL)
      }}
    />
  )
}

export default HelpItem
