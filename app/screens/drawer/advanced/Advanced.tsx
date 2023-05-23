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
import { Popable } from 'react-native-popable'
import AvaText from 'components/AvaText'
import InfoSVG from 'components/svg/InfoSVG'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import { PopableContent } from 'components/PopableContent'

const Advanced = () => {
  const { theme } = useApplicationContext()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isLeftHanded = useSelector(selectIsLeftHanded)
  const dispatch = useDispatch()

  const onTestnetChange = () => {
    dispatch(toggleDeveloperMode())
  }
  const onLeftHandedChange = () => {
    dispatch(toggleLeftHanded())
  }

  return (
    <View style={{ backgroundColor: theme.colorBg2, marginTop: 20 }}>
      <AvaListItem.Base
        titleAlignment="flex-start"
        title={
          <Row style={{ alignItems: 'center' }}>
            <Popable
              content={
                <PopableContent message="Testnet mode changes the interface to allow you to interact with supported testnets." />
              }
              position={'bottom'}
              backgroundColor={theme.colorBg3}
              style={styles.widthStyle}
              wrapperStyle={styles.widthStyle}>
              <Row style={{ alignItems: 'center' }}>
                <AvaText.Heading3 ellipsizeMode="tail">
                  Testnet Mode
                </AvaText.Heading3>
                <Space x={8} />
                <InfoSVG />
              </Row>
            </Popable>
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
      {false && (
        <AvaListItem.Base
          titleAlignment="flex-start"
          title={
            <Row style={{ alignItems: 'center' }}>
              <Popable
                content={
                  <PopableContent message="Move FAB to left screen side." />
                }
                position={'bottom'}
                backgroundColor={theme.colorBg3}
                style={styles.widthStyle}
                wrapperStyle={styles.widthStyle}>
                <Row style={{ alignItems: 'center' }}>
                  <AvaText.Heading3 ellipsizeMode="tail">
                    I'm left-handed
                  </AvaText.Heading3>
                  <Space x={8} />
                  <InfoSVG />
                </Row>
              </Popable>
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
    minWidth: 250
  }
})

export default Advanced
