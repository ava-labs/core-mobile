import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Popable } from 'react-native-popable'
import { PopableLabel } from 'components/PopableLabel'
import { PopableContent } from 'components/PopableContent'
import { StakeSetupScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormInputText } from 'components/form/FormInputText'
import { isEmpty } from 'lodash'
import { Opacity50 } from '../../resources/Constants'

const schema = z.object({
  minUpTime: z
    .string()
    .transform(Number)
    .pipe(z.number().positive().int().gte(1).lte(99)),
  maxFee: z
    .string()
    .transform(Number)
    .pipe(z.number().positive().int().gte(2).lte(20))
})

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.AdvancedStaking
>

const AdvancedStaking = () => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const { stakingAmount, stakingEndTime } =
    useRoute<ScreenProps['route']>().params

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange'
  })
  const onSubmit = (data: any) => {
    navigate(AppNavigation.StakeSetup.SelectNode, {
      minUpTime: Number(data.minUpTime),
      maxFee: Number(data.maxFee),
      stakingAmount,
      stakingEndTime
    })
  }

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
            <View style={{ alignSelf: 'flex-start' }}>
              <PopableComponent
                label="Minimum Uptime"
                message="This is a validator’s uptime, the minimum threshold for rewards is 80%"
              />
            </View>
            <FormInputText
              control={control}
              name={'minUpTime'}
              placeholder="Enter minimum uptime"
              backgroundColor={theme.neutral700 + Opacity50}
              keyboardType="numeric"
              style={styles.inputContainer}
            />
            <AvaText.Caption
              color={errors.minUpTime ? theme.colorError : theme.neutral300}>
              Enter a value between 1-99%
            </AvaText.Caption>
          </View>
          <View>
            <View style={{ alignSelf: 'flex-start' }}>
              <PopableComponent
                label="Maximum Fee"
                message="This is a range set by the protocol."
              />
            </View>
            <FormInputText
              control={control}
              name={'maxFee'}
              placeholder="Enter maximum fee"
              backgroundColor={theme.neutral700 + Opacity50}
              keyboardType="numeric"
              style={styles.inputContainer}
            />
            <AvaText.Caption
              color={errors.maxFee ? theme.colorError : theme.neutral300}>
              Enter a value between 2-20%
            </AvaText.Caption>
          </View>
        </View>
      </View>
      <View style={{ marginBottom: 40 }}>
        <AvaButton.PrimaryLarge
          disabled={!isEmpty(errors)}
          onPress={handleSubmit(onSubmit)}>
          Next
        </AvaButton.PrimaryLarge>
      </View>
    </ScrollView>
  )
}

const PopableComponent = ({
  label,
  message
}: {
  label: string
  message: string
}) => {
  const { theme } = useApplicationContext()

  return (
    <Popable
      content={
        <PopableContent
          backgroundColor={theme.neutral100}
          textStyle={{ color: theme.neutral900 }}
          message={message}
        />
      }
      position={'top'}
      style={{ minWidth: 200 }}
      backgroundColor={theme.neutral100}>
      <PopableLabel
        label={label}
        iconColor={theme.neutral50}
        textStyle={{
          color: theme.neutral50,
          fontWeight: '600',
          fontSize: 14
        }}
      />
    </Popable>
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
