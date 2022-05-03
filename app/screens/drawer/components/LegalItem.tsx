import React from 'react'
import AvaListItem from 'components/AvaListItem'
import useInAppBrowser from 'hooks/useInAppBrowser'

const LEGAL_URL = 'https://wallet.avax.network/legal'

const LegalItem = () => {
  const { openUrl } = useInAppBrowser()
  return (
    <>
      <AvaListItem.Base
        title={'Legal'}
        onPress={() => {
          openUrl(LEGAL_URL)
        }}
      />
    </>
  )
}

export default LegalItem
