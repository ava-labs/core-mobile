import React from 'react'
import { ScrollView, Text, View } from '../Primitives'
import { useTheme } from '../..'
import CheckIcon from '../../assets/icons/check.svg'
import { Card } from './Card'

export default {
  title: 'Card'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={{ padding: 16, gap: 16, alignItems: 'center' }}>
        <Card sx={{ width: '100%' }}>
          <Text>
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book. It has survived not
            only five centuries, but also the leap into electronic typesetting,
            remaining essentially unchanged.
          </Text>
        </Card>

        <Card sx={{ width: '100%', height: 150 }}>
          <Text>
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry.
          </Text>
        </Card>

        <Card sx={{ width: 100, height: 100 }}>
          <CheckIcon />
        </Card>
      </ScrollView>
    </View>
  )
}
