import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import React from 'react'
import { CircularButton, Icons, ScrollView } from '@avalabs/k2-alpine'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const ShareFooter = ({
  onMore
}: {
  onMore: () => void
}): JSX.Element | null => {
  const { bottom } = useSafeAreaInsets()

  const moreButton = (
    <CircularButton title="More" onPress={onMore}>
      <Icons.Navigation.MoreHoriz />
    </CircularButton>
  )

  const actions = [moreButton]

  if (actions.length === 0) {
    return null
  }

  return (
    <LinearGradientBottomWrapper>
      <ScrollView
        sx={{
          paddingBottom: bottom + 12,
          flexDirection: 'row',
          gap: 12
        }}
        contentContainerSx={{ paddingHorizontal: 28 }}
        horizontal>
        {actions}
      </ScrollView>
    </LinearGradientBottomWrapper>
  )
}
