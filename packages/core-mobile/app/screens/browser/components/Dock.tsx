import React from 'react'
import CarrotSVG from 'components/svg/CarrotSVG'
import CreateNewWalletPlusSVG, {
  IconWeight
} from 'components/svg/CreateNewWalletPlusSVG'
import EllipsisSVG from 'components/svg/EllipsisSVG'
import { TouchableOpacity, useTheme } from '@avalabs/k2-mobile'
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { noop } from '@avalabs/utils-sdk'
import { TabIcon } from './TabIcon'
import { DockMenu } from './DockMenu'

export const Dock = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const goBackward = noop
  const goForward = noop
  const createNewTab = noop
  const navigateToTabList = noop

  return (
    <Animated.View
      style={{
        height: 64,
        left: 43.5,
        right: 43.5,
        backgroundColor: '#BFBFBF70',
        opacity: 0.44,
        borderRadius: 41,
        justifyContent: 'space-around',
        alignItems: 'center',
        flexDirection: 'row',
        bottom: 16,
        position: 'absolute',
        zIndex: 1
      }}
      entering={FadeInDown}
      exiting={FadeOutDown}>
      <TouchableOpacity onPress={goBackward}>
        <CarrotSVG direction="left" size={26} color={colors.$neutral900} />
      </TouchableOpacity>
      <TouchableOpacity onPress={goForward}>
        <CarrotSVG size={26} color={colors.$neutral900} />
      </TouchableOpacity>
      <TouchableOpacity onPress={createNewTab}>
        <CreateNewWalletPlusSVG
          size={21}
          weight={IconWeight.extraBold}
          color={colors.$neutral900}
        />
      </TouchableOpacity>
      <TabIcon numberOfTabs={10} onPress={navigateToTabList} />
      <DockMenu>
        <EllipsisSVG color={colors.$neutral900} size={25} />
      </DockMenu>
    </Animated.View>
  )
}
