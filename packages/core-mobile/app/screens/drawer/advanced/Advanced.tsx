import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import Switch from 'components/Switch'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectIsDeveloperMode,
  selectIsLeftHanded,
  toggleDeveloperMode,
  toggleLeftHanded
} from 'store/settings/advanced'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import { selectUseLeftFab } from 'store/posthog'
import { Tooltip } from 'components/Tooltip'
import AnalyticsService from 'services/analytics/AnalyticsService'

const Advanced = (): JSX.Element => {
  const { theme } = useApplicationContext()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isLeftHanded = useSelector(selectIsLeftHanded)
  const useLeftFab = useSelector(selectUseLeftFab)
  const dispatch = useDispatch()

  const onTestnetChange = (value: boolean): void => {
    AnalyticsService.capture(
      value ? 'DeveloperModeEnabled' : 'DeveloperModeDisabled'
    )
    dispatch(toggleDeveloperMode())
  }
  const onLeftHandedChange = (): void => {
    dispatch(toggleLeftHanded())
  }

  return (
    <View style={{ backgroundColor: theme.colorBg2, marginTop: 20 }}>
      <AvaListItem.Base
        titleAlignment="flex-start"
        title={
          <Row style={{ alignItems: 'center' }}>
            <Tooltip
              content="Testnet mode changes the interface to allow you to interact with supported testnets."
              position={'right'}
              style={styles.widthStyle}>
              <Row style={{ alignItems: 'center' }}>
                <AvaText.Heading3 ellipsizeMode="tail">
                  Testnet Mode
                </AvaText.Heading3>
              </Row>
            </Tooltip>
          </Row>
        }
        background={theme.background}
        rightComponent={
          <Switch
            value={isDeveloperMode}
            onValueChange={onTestnetChange}
            testID="switch"
          />
        }
      />
      {useLeftFab && (
        <AvaListItem.Base
          titleAlignment="flex-start"
          title={
            <Row style={{ alignItems: 'center' }}>
              <Tooltip
                content="Move FAB to left screen side."
                position={'bottom'}
                style={styles.widthStyle}>
                <Row style={{ alignItems: 'center' }}>
                  <AvaText.Heading3 ellipsizeMode="tail">
                    I'm left-handed
                  </AvaText.Heading3>
                </Row>
              </Tooltip>
            </Row>
          }
          background={theme.background}
          rightComponent={
            <Switch value={isLeftHanded} onValueChange={onLeftHandedChange} />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  widthStyle: {
    width: 150
  }
})

export default Advanced
