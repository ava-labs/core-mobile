import React, { useCallback, useMemo } from 'react'
import { GroupList, GroupListItem, Icons, useTheme } from '@avalabs/k2-alpine'
import { HELP_URL } from 'common/consts/urls'
import { useUserUniqueID } from 'common/hooks/useUserUniqueID'
import { copyToClipboard } from 'common/utils/clipboard'

export const Support = ({
  onPressItem
}: {
  onPressItem: ({ url }: { url: string }) => void
}): React.JSX.Element => {
  const { theme } = useTheme()
  const userUniqueID = useUserUniqueID()

  const openHelpCenter = useCallback(() => {
    onPressItem({
      url: HELP_URL
    })
  }, [onPressItem])

  const handlePressUniqueUserId = useCallback(() => {
    copyToClipboard(userUniqueID, 'Unique user ID copied to clipboard')
  }, [userUniqueID])

  const data = useMemo(() => {
    const items: GroupListItem[] = [
      {
        title: 'Help center',
        onPress: openHelpCenter,
        accessory: (
          <Icons.Custom.Outbound
            width={24}
            height={24}
            color={theme.colors.$textPrimary}
          />
        )
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
    theme.colors.$textPrimary,
    openHelpCenter,
    userUniqueID,
    handlePressUniqueUserId
  ])

  return (
    <GroupList
      data={data}
      titleSx={{ fontSize: 16, lineHeight: 22, fontFamily: 'Inter-Regular' }}
      textContainerSx={{ marginRight: 32 }}
      valueSx={{ fontFamily: 'DejaVuSansMono', fontSize: 16 }}
      separatorMarginRight={16}
    />
  )
}
