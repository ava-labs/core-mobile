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

const StakingDuration = () => {
  const [selectedDuration, setSelectedDuration] = useState('')
  const { theme } = useApplicationContext()

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false)
  const [date, setDate] = useState<Date>()

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

  const toggleDatePickerVisibility = (value: boolean) => {
    setDatePickerVisibility(value)
  }

  const handleDateConfirm = (dateInput: Date) => {
    setDate(dateInput)
    setDatePickerVisibility(false)
  }

  console.log('popeyes', selectedDuration.length > 0)

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <AvaText.LargeTitleBold>Duration</AvaText.LargeTitleBold>
        <AvaText.Subtitle1
          textStyle={{
            marginTop: 7,
            color: theme.neutral50,
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
                    <AvaText.Body2 textStyle={{ color: theme.neutral50 }}>
                      {item.title}
                    </AvaText.Body2>
                    <AvaText.Caption textStyle={{ color: theme.neutral400 }}>
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
                  <AvaText.Body1 textStyle={{ color: theme.neutral50 }}>
                    {customOptions.title}
                  </AvaText.Body1>
                  <AvaText.Caption textStyle={{ color: theme.neutral50 }}>
                    {customOptions.subTitle}
                  </AvaText.Caption>
                </View>
              </RadioButton>
            </View>
            <Row style={{ alignItems: 'center' }}>
              <AvaText.Body2
                textStyle={{ color: theme.neutral50, fontWeight: '600' }}>
                End Date
              </AvaText.Body2>
              <Space x={8} />
              <InfoSVG />
            </Row>
            <CalendarInput
              date={date}
              isDatePickerVisible={isDatePickerVisible}
              setIsDatePickerVisible={toggleDatePickerVisibility}
              handleDateConfirm={handleDateConfirm}
              placeHolder=" March 22, 2024"
            />
            <AvaText.Caption textStyle={{ color: theme.neutral300 }}>
              Actual end date will vary depending on options available
            </AvaText.Caption>
          </>
        )}
      </View>

      <View>
        <AvaButton.PrimaryLarge disabled={!selectedDuration}>
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
