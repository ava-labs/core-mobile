import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { StakeSetupScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormInputText } from 'components/form/FormInputText'
import { isEmpty } from 'lodash'
import { Tooltip } from 'components/Tooltip'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Opacity50 } from '../../resources/Constants'

type TFormProps = {
  minUpTime: string
  maxFee: string
}

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

const AdvancedStaking = (): JSX.Element => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const { stakingEndTime, selectedDuration } =
    useRoute<ScreenProps['route']>().params

  const minimumUptimeCaption = 'Enter a value between 1-99%'

  const {
    control,
    handleSubmit,
    formState: { errors, dirtyFields }
  } = useForm<TFormProps>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      minUpTime: '',
      maxFee: ''
    }
  })
  const onSubmit = (data: TFormProps): void => {
    AnalyticsService.capture('StakeStartNodeSearch', {
      from: 'AdvancedStakingScreen',
      duration: selectedDuration
    })
    navigate(AppNavigation.StakeSetup.SelectNode, {
      minUpTime: Number(data.minUpTime),
      maxFee: Number(data.maxFee),
      stakingEndTime
    })
  }

  const isDisabled =
    !isEmpty(errors) ||
    dirtyFields.minUpTime === undefined ||
    dirtyFields.maxFee === undefined

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
            <PopableComponent
              label="Minimum Uptime"
              message="This is a validator’s uptime, the minimum threshold for rewards is 80%"
              width={130}
            />
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
              {minimumUptimeCaption}
            </AvaText.Caption>
          </View>
          <View>
            <PopableComponent
              label="Maximum Delegation Fee"
              message="This is a range set by the protocol."
              width={141}
            />
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
          disabled={isDisabled}
          onPress={handleSubmit(onSubmit)}>
          Next
        </AvaButton.PrimaryLarge>
      </View>
    </ScrollView>
  )
}

const PopableComponent = ({
  label,
  message,
  width
}: {
  label: string
  message: string
  width: number
}): JSX.Element => {
  const { theme } = useApplicationContext()

  return (
    <Tooltip
      content={message}
      style={{ width }}
      iconColor={theme.neutral50}
      textStyle={{
        color: theme.neutral50,
        fontWeight: '600',
        fontSize: 14
      }}>
      {label}
    </Tooltip>
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
