import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import AvaText from 'components/AvaText'
import { RadioButton } from 'components/RadioButton'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import InputText from 'components/InputText'
import { Space } from 'components/Space'
import InfoSVG from 'components/svg/InfoSVG'
import { Row } from 'components/Row'

const StakingDuration = () => {
  const [selectedDuration, setSelectedDuration] = useState('')
  const { theme } = useApplicationContext()

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
  return (
    <ScrollView
      contentContainerStyle={{
        flex: 1,
        paddingHorizontal: 16,
        justifyContent: 'space-between'
      }}>
      <View>
        <AvaText.LargeTitleBold textStyle={{}}>Duration</AvaText.LargeTitleBold>
        <AvaText.Subtitle1
          textStyle={{ marginTop: 7, color: 'white', marginBottom: 32 }}>
          How long would you like to stake?
        </AvaText.Subtitle1>
        {selectedDuration !== 'Custom' ? (
          <>
            {durationOptions.map(item => {
              return (
                <View style={{ marginBottom: 24 }} key={item.title}>
                  <RadioButton
                    onPress={() => setSelectedDuration(item.title)}
                    selected={selectedDuration === item.title}>
                    <View style={{ marginLeft: 10 }}>
                      <AvaText.Body1 textStyle={{ color: '#F8F8FB' }}>
                        {item.title}
                      </AvaText.Body1>
                      <AvaText.Caption textStyle={{ color: '#B4B4B7' }}>
                        {item.subTitle}
                      </AvaText.Caption>
                    </View>
                  </RadioButton>
                </View>
              )
            })}
          </>
        ) : (
          <>
            <View style={{ marginBottom: 24 }}>
              <RadioButton
                onPress={() => setSelectedDuration(customOptions.title)}
                selected={selectedDuration === customOptions.title}>
                <View style={{ marginLeft: 10 }}>
                  <AvaText.Body1 textStyle={{ color: '#F8F8FB' }}>
                    {customOptions.title}
                  </AvaText.Body1>
                  <AvaText.Caption textStyle={{ color: '#B4B4B7' }}>
                    {customOptions.subTitle}
                  </AvaText.Caption>
                </View>
              </RadioButton>
            </View>
            <Row style={{ alignItems: 'center' }}>
              <AvaText.Body2
                textStyle={{ color: theme.colorText1, fontWeight: '600' }}>
                End Date
              </AvaText.Body2>
              <Space x={8} />
              <InfoSVG />
            </Row>

            <View style={{ marginHorizontal: -16 }}>
              <InputText
                placeholder={'Enter contact name'}
                text={''}
                onChangeText={() => console.log('djdjd')}
              />
            </View>
            <AvaText.Caption textStyle={{ color: '#B4B4B7' }}>
              Actual end date will vary depending on options available
            </AvaText.Caption>
          </>
        )}
      </View>

      <View>
        <AvaButton.PrimaryLarge
        // disabled={sendDisabled}
        // onPress={onNextPress}
        >
          Next
        </AvaButton.PrimaryLarge>
        <AvaButton.TextLink
          // disabled={sendDisabled}
          // onPress={onNextPress}
          textColor="#3AA3FF">
          Advanced Set Up
        </AvaButton.TextLink>
      </View>
    </ScrollView>
  )
}

export default StakingDuration
