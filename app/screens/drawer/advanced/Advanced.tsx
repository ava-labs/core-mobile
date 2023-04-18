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
import { Popable } from 'react-native-popable'
import AvaText from 'components/AvaText'
import InfoSVG from 'components/svg/InfoSVG'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import { PopableContent } from 'components/PopableContent'

const testnetPopableContent = (
  <PopableContent message="Testnet mode changes the interface to allow you to interact with supported testnets." />
)

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
        titleAlignment="flex-start"
        title={
          <Row style={{ alignItems: 'center' }}>
            <Popable
              content={testnetPopableContent}
              position={'bottom'}
              backgroundColor={theme.colorBg3}
              style={[
                {
                  minWidth: 250
                }
              ]}
              wrapperStyle={{
                minWidth: 250
              }}>
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
            onValueChange={onValueChange}
            testID="switch"
          />
        }
      />
    </View>
  )
}

export default Advanced
