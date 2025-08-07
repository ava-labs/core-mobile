import React, { useCallback, useMemo } from 'react'
import { GroupList, GroupListItem } from '@avalabs/k2-alpine'
import {
  BUG_REPORT_URL,
  FEATURE_REQUEST_URL,
  HELP_URL
} from 'common/consts/urls'
import { useUserUniqueID } from 'common/hooks/useUserUniqueID'
import { copyToClipboard } from 'common/utils/clipboard'

export const Support = ({
  onPressItem
}: {
  onPressItem: ({ url, title }: { url: string; title: string }) => void
}): React.JSX.Element => {
  const userUniqueID = useUserUniqueID()

  const openHelpCenter = useCallback(() => {
    onPressItem({
      url: HELP_URL,
      title: 'Help center'
    })
  }, [onPressItem])

  const openBugReport = useCallback(() => {
    onPressItem({
      url: BUG_REPORT_URL,
      title: 'Bug report'
    })
  }, [onPressItem])

  const openFeatureRequest = useCallback(() => {
    onPressItem({
      url: FEATURE_REQUEST_URL,
      title: 'Feature request'
    })
  }, [onPressItem])

  const handlePressUniqueUserId = useCallback(() => {
    copyToClipboard(userUniqueID, 'Unique user ID copied to clipboard')
  }, [userUniqueID])

  const data = useMemo(() => {
    const items: GroupListItem[] = [
      {
        title: 'Send feedback',
        onPress: openFeatureRequest
      },
      {
        title: 'Report a bug',
        onPress: openBugReport
      },
      {
        title: 'Help center',
        onPress: openHelpCenter
      },
      {
        title: 'Unique user ID',
        value: userUniqueID,
        onPress: handlePressUniqueUserId,
        accessory: <></>
      }
    ]

    return items
  }, [
    openBugReport,
    openFeatureRequest,
    openHelpCenter,
    handlePressUniqueUserId,
    userUniqueID
  ])

  return (
    <GroupList
      data={data}
      titleSx={{ fontSize: 16, lineHeight: 22, fontFamily: 'Inter-Regular' }}
      textContainerSx={{ marginRight: 32 }}
      separatorMarginRight={16}
    />
  )
}
