import React, { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { RadioButton } from 'components/RadioButton'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import InfoSVG from 'components/svg/InfoSVG'
import { Row } from 'components/Row'
import { CalendarInput } from 'components/CalendarInput'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { EarnScreenProps } from 'navigation/types'

type EarnScreenNavProps = EarnScreenProps<
  typeof AppNavigation.Earn.StakingDuration
>

const StakingDuration = () => {
  const [selectedDuration, setSelectedDuration] = useState('')
  const { theme } = useApplicationContext()
  const [date, setDate] = useState<Date>()
  const { navigate } = useNavigation<EarnScreenNavProps['navigation']>()

  const durationOptions = [
    { title: '1 Week', subTitle: 'Estimated Rewards: 0.54 AVAX' },
    { title: '1 Month', subTitle: 'Estimated Rewards: 1.54 AVAX' },
    { title: '3 Months', subTitle: 'Estimated Rewards: 3.54 AVAX' },
    { title: '6 Months', subTitle: 'Estimated Rewards: 6.54 AVAX' },
    { title: '1 Year', subTitle: 'Estimated Rewards: 12.54 AVAX' },
    { title: 'Custom', subTitle: 'Enter your desired end date' }
  ]

  const customOptions = {
    title: 'Custom',
    subTitle: 'Enter your desired end date'
  }

  const onRadioSelect = (value: string) => {
    if (selectedDuration === value) {
      return setSelectedDuration('')
    }
    return setSelectedDuration(value)
  }

  const handleDateConfirm = (dateInput: Date) => {
    setDate(dateInput)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <AvaText.LargeTitleBold>Duration</AvaText.LargeTitleBold>
        <AvaText.Subtitle1
          textStyle={{
            marginTop: 7,
            color: theme.colorText1,
            marginBottom: 32
          }}>
          How long would you like to stake?
        </AvaText.Subtitle1>
        {selectedDuration !== 'Custom' ? (
          durationOptions.map(item => {
            return (
              <View style={{ marginBottom: 24 }} key={item.title}>
                <RadioButton
                  onPress={() => onRadioSelect(item.title)}
                  selected={selectedDuration === item.title}>
                  <View style={{ marginLeft: 10 }}>
                    <AvaText.Body2 textStyle={{ color: theme.colorText1 }}>
                      {item.title}
                    </AvaText.Body2>
                    <AvaText.Caption textStyle={{ color: theme.colorText2 }}>
                      {item.subTitle}
                    </AvaText.Caption>
                  </View>
                </RadioButton>
              </View>
            )
          })
        ) : (
          <>
            <View style={{ marginBottom: 24 }}>
              <RadioButton
                onPress={() => onRadioSelect(customOptions.title)}
                selected={selectedDuration === customOptions.title}>
                <View style={{ marginLeft: 10 }}>
                  <AvaText.Body1 textStyle={{ color: theme.colorText1 }}>
                    {customOptions.title}
                  </AvaText.Body1>
                  <AvaText.Caption textStyle={{ color: theme.colorText1 }}>
                    {customOptions.subTitle}
                  </AvaText.Caption>
                </View>
              </RadioButton>
            </View>
            <Row style={{ alignItems: 'center' }}>
              <AvaText.Heading3
                textStyle={{ color: theme.colorText1, fontWeight: '600' }}>
                End Date
              </AvaText.Heading3>
              <Space x={8} />
              <InfoSVG />
            </Row>
            <CalendarInput
              date={date}
              onDateSelected={handleDateConfirm}
              placeHolder=" March 22, 2024"
            />
            <AvaText.Caption textStyle={{ color: theme.neutral300 }}>
              Actual end date will vary depending on options available
            </AvaText.Caption>
          </>
        )}
      </View>

      <View>
        <AvaButton.PrimaryLarge
          disabled={!selectedDuration}
          onPress={() => navigate(AppNavigation.Earn.NodeSearch)}>
          Next
        </AvaButton.PrimaryLarge>
        <AvaButton.TextLink textColor={theme.colorPrimary1}>
          Advanced Set Up
        </AvaButton.TextLink>
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

export default StakingDuration
