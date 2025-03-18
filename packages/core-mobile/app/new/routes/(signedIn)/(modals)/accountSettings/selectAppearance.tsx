import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  useTheme
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { useDispatch, useSelector } from 'react-redux'
import {
  Appearance,
  selectSelectedAppearance,
  setSelectedAppearance
} from 'store/settings/appearance'
import { ImageRequireSource } from 'react-native'

const SelectAppearanceScreen = (): JSX.Element => {
  const dispatch = useDispatch()
  const selectedAppearance = useSelector(selectSelectedAppearance)
  const { canGoBack, back } = useRouter()

  const handleSelectAppearance = (appearance: Appearance): void => {
    dispatch(setSelectedAppearance(appearance))
    canGoBack() && back()
  }

  return (
    <View
      sx={{
        gap: 85,
        marginHorizontal: 16
      }}>
      <Text variant="heading2">Customize the app appearance</Text>
      <View
        sx={{
          flexDirection: 'row',
          marginHorizontal: 16,
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <AppearanceComponent
          isSelected={selectedAppearance === Appearance.Light}
          appearance="Light"
          onPress={() => handleSelectAppearance(Appearance.Light)}
          source={require('../../../../assets/icons/light_appearance.png')}
        />
        <AppearanceComponent
          isSelected={selectedAppearance === Appearance.Dark}
          appearance="Dark"
          onPress={() => handleSelectAppearance(Appearance.Dark)}
          source={require('../../../../assets/icons/dark_appearance.png')}
        />
        <AppearanceComponent
          isSelected={selectedAppearance === Appearance.System}
          appearance="System"
          onPress={() => handleSelectAppearance(Appearance.System)}
          source={require('../../../../assets/icons/system_appearance.png')}
        />
      </View>
    </View>
  )
}

const AppearanceComponent = ({
  appearance,
  isSelected,
  onPress,
  source
}: {
  appearance: string
  isSelected: boolean
  onPress: () => void
  source: ImageRequireSource
}): JSX.Element => {
  return (
    <View sx={{ gap: 12 }}>
      <TouchableOpacity
        sx={{
          height: 194,
          justifyContent: 'center'
        }}
        onPress={onPress}>
        <Image source={source} />
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
