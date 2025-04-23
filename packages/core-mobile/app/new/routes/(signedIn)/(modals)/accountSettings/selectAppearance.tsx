import React, { FC } from 'react'
import { View, Text, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
import { useDispatch, useSelector } from 'react-redux'
import {
  Appearance,
  selectSelectedAppearance,
  setSelectedAppearance
} from 'store/settings/appearance'
import { SvgProps } from 'react-native-svg'
import SystemAppearanceIcon from '../../../../assets/icons/system_appearance.svg'
import LightAppearanceIcon from '../../../../assets/icons/light_appearance.svg'
import DarkAppearanceIcon from '../../../../assets/icons/dark_appearance.svg'

const SelectAppearanceScreen = (): JSX.Element => {
  const selectedAppearance = useSelector(selectSelectedAppearance)
  const dispatch = useDispatch()

  return (
    <View
      sx={{
        gap: 85,
        marginHorizontal: 16
      }}>
      <Text variant="heading2">{`Customize the\napp theme`}</Text>
      <View
        sx={{
          flexDirection: 'row',
          marginHorizontal: 16,
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <AppearanceComponent
          isSelected={selectedAppearance === Appearance.System}
          appearance="System"
          onPress={() => dispatch(setSelectedAppearance(Appearance.System))}
          Icon={SystemAppearanceIcon}
        />
        <AppearanceComponent
          isSelected={selectedAppearance === Appearance.Light}
          appearance="Light"
          onPress={() => dispatch(setSelectedAppearance(Appearance.Light))}
          Icon={LightAppearanceIcon}
        />
        <AppearanceComponent
          isSelected={selectedAppearance === Appearance.Dark}
          appearance="Dark"
          onPress={() => dispatch(setSelectedAppearance(Appearance.Dark))}
          Icon={DarkAppearanceIcon}
        />
      </View>
    </View>
  )
}

const AppearanceComponent = ({
  appearance,
  isSelected,
  onPress,
  Icon
}: {
  appearance: string
  isSelected: boolean
  onPress: () => void
  Icon: FC<SvgProps>
}): JSX.Element => {
  return (
    <View sx={{ gap: 12 }}>
      <TouchableOpacity
        testID={
          isSelected ? `${appearance}_selected` : `${appearance}_unselected`
        }
        sx={{
          height: 194,
          justifyContent: 'center'
        }}
        onPress={onPress}>
        <Icon />
      </TouchableOpacity>
      <TextLabel isSelected={isSelected}>{appearance}</TextLabel>
    </View>
  )
}

const TextLabel = ({
  children,
  isSelected
}: {
  children: string
  isSelected: boolean
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <View
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: isSelected ? colors.$textPrimary : 'transparent'
      }}>
      <Text
        variant="buttonSmall"
        sx={{
          color: isSelected ? colors.$surfacePrimary : colors.$textPrimary
        }}>
        {children}
      </Text>
    </View>
  )
}

export default SelectAppearanceScreen
