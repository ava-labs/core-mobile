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

const SelectAppearanceScreen = (): JSX.Element => {
  const dispatch = useDispatch()
  const selectedAppearance = useSelector(selectSelectedAppearance)
  const { canGoBack, back } = useRouter()
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
        <View sx={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              dispatch(setSelectedAppearance(Appearance.Light))
              canGoBack() && back()
            }}>
            <Image
              source={require('../../../../assets/icons/light_appearance.png')}
            />
          </TouchableOpacity>
          <TextLabel isSelected={selectedAppearance === Appearance.Light}>
            Light
          </TextLabel>
        </View>
        <View sx={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              dispatch(setSelectedAppearance(Appearance.Dark))
              canGoBack() && back()
            }}>
            <Image
              source={require('../../../../assets/icons/dark_appearance.png')}
            />
          </TouchableOpacity>
          <TextLabel isSelected={selectedAppearance === Appearance.Dark}>
            Dark
          </TextLabel>
        </View>
        <View sx={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => {
              dispatch(setSelectedAppearance(Appearance.System))
              canGoBack() && back()
            }}>
            <Image
              source={require('../../../../assets/icons/system_appearance.png')}
            />
          </TouchableOpacity>
          <TextLabel isSelected={selectedAppearance === Appearance.System}>
            System
          </TextLabel>
        </View>
      </View>
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
