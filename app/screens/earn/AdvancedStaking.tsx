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
import { useNavigation, useRoute } from '@react-navigation/native'
import { Opacity50 } from '../../resources/Constants'

type NavigationProp = EarnScreenProps<typeof AppNavigation.Earn.AdvancedStaking>

const AdvancedStaking = () => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<NavigationProp['navigation']>()
  const { stakingAmount, stakingEndTime } =
    useRoute<NavigationProp['route']>().params
  const [minUptime, setMinUptime] = useState<string | undefined>(undefined)
  const [maxFee, setMaxFee] = useState<string | undefined>(undefined)
  const isMaxFeeValid = !!maxFee && Number(maxFee) >= 2 && Number(maxFee) <= 20
  const isMinUptimeValid =
    !!minUptime && Number(minUptime) >= 1 && Number(minUptime) <= 99
  const isNextDisabled = !isMaxFeeValid || !isMinUptimeValid

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <AvaText.LargeTitleBold>Validator Inputs</AvaText.LargeTitleBold>
        <AvaText.Subtitle1
          textStyle={{
            marginTop: 7,
            color: theme.colorText1,
            marginBottom: 32
          }}>
          Choose the parameters for your desired staking node.
        </AvaText.Subtitle1>
        <View>
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
                  fontSize: 14
                }}
              />
            </Popable>
            <InputText
              placeholder={'Enter minimum uptime'}
              text={minUptime ?? ''}
              backgroundColor={theme.neutral700 + Opacity50}
              onChangeText={text => setMinUptime(text)}
              keyboardType="numeric"
              style={styles.inputContainer}
            />
            <AvaText.Caption
              color={isMinUptimeValid ? theme.neutral300 : theme.colorError}>
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
                  fontSize: 14
                }}
              />
            </Popable>
            <InputText
              placeholder={'Enter maximum fee'}
              text={maxFee ?? ''}
              backgroundColor={theme.neutral700 + Opacity50}
              onChangeText={text => setMaxFee(text)}
              keyboardType="numeric"
              style={styles.inputContainer}
            />
            <AvaText.Caption
              color={isMaxFeeValid ? theme.neutral300 : theme.colorError}>
              Enter a value between 2-20%
            </AvaText.Caption>
          </View>
        </View>
      </View>

      <View style={{ marginBottom: 40 }}>
        <AvaButton.PrimaryLarge
          disabled={isNextDisabled}
          onPress={() =>
            navigate(AppNavigation.Earn.SelectNode, {
              minUptime,
              maxFee,
              stakingAmount,
              stakingEndTime
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
  },
  inputContainer: {
    width: '100%',
    marginLeft: 0
  }
})

export default AdvancedStaking
