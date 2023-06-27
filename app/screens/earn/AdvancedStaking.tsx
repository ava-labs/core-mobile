import React, { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import InputText from 'components/InputText'
import { Popable } from 'react-native-popable'
import { PopableLabel } from 'components/PopableLabel'
import { PopableContent } from 'components/PopableContent'
import { EarnScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'

type NavigationProp = EarnScreenProps<
  typeof AppNavigation.Earn.SelectNode
>['navigation']

const AdvancedStaking = () => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<NavigationProp>()

  const [minUptime, setMinUptime] = useState('')
  const [maxFee, setMaxFee] = useState('')
  const isNextDisabled = !!maxFee || !!minUptime

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <AvaText.LargeTitleBold>Fee and Uptime</AvaText.LargeTitleBold>
        <AvaText.Subtitle1
          textStyle={{
            marginTop: 7,
            color: theme.colorText1,
            marginBottom: 32
          }}>
          Choose your maximum fee and minimum uptime.
        </AvaText.Subtitle1>
        <View style={{ marginBottom: 24 }}>
          <Popable
            content={
              <PopableContent
                backgroundColor={theme.neutral100}
                textStyle={{ color: theme.neutral900 }}
                message="This is a validator’s uptime, the minimum threshold for rewards is 80%"
              />
            }
            position={'top'}
            style={{ minWidth: 200 }}
            backgroundColor={theme.neutral100}>
            <PopableLabel
              label="Minimum Uptime"
              iconColor={theme.neutral50}
              textStyle={{
                color: theme.neutral50,
                fontWeight: '600',
                fontSize: 14,
                marginLeft: 16
              }}
            />
          </Popable>
          <InputText
            placeholder={'Enter minimum uptime'}
            text={minUptime}
            backgroundColor={theme.neutral700}
            onChangeText={text => setMinUptime(text)}
            keyboardType="numeric"
          />
          <AvaText.Caption
            color={theme.neutral300}
            textStyle={{ marginLeft: 16 }}>
            Enter a value between 1-99%
          </AvaText.Caption>
        </View>
        <View>
          <Popable
            content={
              <PopableContent
                backgroundColor={theme.neutral100}
                textStyle={{ color: theme.neutral900 }}
                message="This is a range set by the protocol."
              />
            }
            position={'top'}
            style={{ minWidth: 200 }}
            backgroundColor={theme.neutral100}>
            <PopableLabel
              label="Maximum Fee"
              iconColor={theme.neutral50}
              textStyle={{
                color: theme.neutral50,
                fontWeight: '600',
                fontSize: 14,
                marginLeft: 16
              }}
            />
          </Popable>
          <InputText
            placeholder={'Enter maximum fee'}
            text={maxFee}
            backgroundColor={theme.neutral700}
            onChangeText={text => setMaxFee(text)}
            keyboardType="numeric"
          />
          <AvaText.Caption
            color={theme.neutral300}
            textStyle={{ marginLeft: 16 }}>
            Enter a value between 2-20%
          </AvaText.Caption>
        </View>
      </View>

      <View>
        <AvaButton.PrimaryLarge
          disabled={!isNextDisabled}
          onPress={() =>
            navigate(AppNavigation.Earn.SelectNode, {
              minUptime,
              maxFee
            })
          }>
          Next
        </AvaButton.PrimaryLarge>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between'
  }
})

export default AdvancedStaking
