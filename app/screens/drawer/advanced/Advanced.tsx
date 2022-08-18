import React from 'react'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import Switch from 'components/Switch'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { AdvancedScreenProps } from 'navigation/types'

type NavigationProp = AdvancedScreenProps<
  typeof AppNavigation.Advanced.Advanced
>['navigation']

const Advanced = () => {
  const { theme } = useApplicationContext()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const dispatch = useDispatch()
  const navigation = useNavigation<NavigationProp>()

  const onValueChange = () => {
    dispatch(toggleDeveloperMode())
  }

  return (
    <View>
      <View style={{ backgroundColor: theme.colorBg2, marginTop: 20 }}>
        <AvaListItem.Base
          title={'Developer Mode'}
          background={theme.background}
          rightComponent={
            <Switch value={isDeveloperMode} onValueChange={onValueChange} />
          }
        />
        {__DEV__ && (
          <AvaListItem.Base
            title={'Connect Dapp'}
            background={theme.background}
            onPress={() =>
              navigation.navigate(AppNavigation.Advanced.DappConnectModal)
            }
          />
        )}
      </View>
    </View>
  )
}

export default Advanced
