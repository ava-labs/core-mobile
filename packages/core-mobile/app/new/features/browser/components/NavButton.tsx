import { SvgProps } from 'react-native-svg'
import React from 'react'
import { TouchableOpacity, useTheme } from '@avalabs/k2-alpine'

const NavButton = ({
  Icon,
  onPress,
  disabled = false,
  testID
}: {
  Icon: React.FC<SvgProps>
  onPress: () => void
  disabled?: boolean
  testID?: string
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ left: 15, right: 15, top: 15, bottom: 15 }}>
      <Icon
        width={24}
        height={24}
        color={disabled ? theme.colors.$neutral800 : theme.colors.$neutral50}
      />
    </TouchableOpacity>
  )
}

export default NavButton
