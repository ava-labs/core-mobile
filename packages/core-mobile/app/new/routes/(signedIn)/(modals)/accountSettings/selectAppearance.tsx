import { AnimatedPressable, Text, useTheme, View } from '@avalabs/k2-alpine'
import { setThemePreference } from '@vonovak/react-native-theme-control'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { FC } from 'react'
import { SvgProps } from 'react-native-svg'
import { useDispatch, useSelector } from 'react-redux'
import {
  Appearance,
  selectSelectedAppearance,
  setSelectedAppearance
} from 'store/settings/appearance'
import DarkAppearanceIcon from '../../../../assets/icons/dark_appearance.svg'
import LightAppearanceIcon from '../../../../assets/icons/light_appearance.svg'
import SystemAppearanceIcon from '../../../../assets/icons/system_appearance.svg'

const SelectAppearanceScreen = (): JSX.Element => {
  const selectedAppearance = useSelector(selectSelectedAppearance)
  const dispatch = useDispatch()

  const handleAppearancePress = (appearance: Appearance): void => {
    dispatch(setSelectedAppearance(appearance))

    switch (appearance) {
      case Appearance.System:
        setThemePreference('system')
        break
      case Appearance.Dark:
        setThemePreference('dark')
        break
      case Appearance.Light:
        setThemePreference('light')
        break
    }
  }

  return (
    <ScrollScreen
      title={`Customize the\napp appearance`}
      navigationTitle="Customize the app appearance"
      isModal
      contentContainerStyle={{
        padding: 16
      }}>
      <View
        sx={{
          flexDirection: 'row',
          marginHorizontal: 16,
          paddingTop: 64,
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <AppearanceComponent
          isSelected={selectedAppearance === Appearance.System}
          appearance="System"
          onPress={() => handleAppearancePress(Appearance.System)}
          Icon={SystemAppearanceIcon}
        />
        <AppearanceComponent
          isSelected={selectedAppearance === Appearance.Light}
          appearance="Light"
          onPress={() => handleAppearancePress(Appearance.Light)}
          Icon={LightAppearanceIcon}
        />
        <AppearanceComponent
          isSelected={selectedAppearance === Appearance.Dark}
          appearance="Dark"
          onPress={() => handleAppearancePress(Appearance.Dark)}
          Icon={DarkAppearanceIcon}
        />
      </View>
    </ScrollScreen>
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
      <AnimatedPressable
        testID={
          isSelected ? `${appearance}_selected` : `${appearance}_unselected`
        }
        style={{
          height: 194,
          justifyContent: 'center'
        }}
        onPress={onPress}>
        <Icon />
      </AnimatedPressable>
      <AnimatedPressable onPress={onPress}>
        <TextLabel isSelected={isSelected}>{appearance}</TextLabel>
      </AnimatedPressable>
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
        alignSelf: 'center',
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
