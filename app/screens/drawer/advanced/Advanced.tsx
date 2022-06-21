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

const Advanced = () => {
  const { theme } = useApplicationContext()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const dispatch = useDispatch()

  const onValueChange = () => {
    dispatch(toggleDeveloperMode())
  }

  return (
    <View style={{ backgroundColor: theme.colorBg2, marginTop: 20 }}>
      <AvaListItem.Base
        title={'Developer Mode'}
        background={theme.background}
        rightComponent={
          <Switch value={isDeveloperMode} onValueChange={onValueChange} />
        }
      />
    </View>
  )
}

export default Advanced
