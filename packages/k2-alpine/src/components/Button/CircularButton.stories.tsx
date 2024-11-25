import React from 'react'
import { ScrollView, View } from '../Primitives'
import { Icons, useTheme } from '../..'
import { CircularButton } from './CircularButton'

export default {
  title: 'CircularButton'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const iconComponents = [
    <Icons.Custom.FaceID width={32} height={32} />,
    <Icons.Custom.TouchID width={32} height={32} />,
    <Icons.Custom.Pin width={26} height={26} />
  ]

  const renderRow = (icon: JSX.Element): JSX.Element => {
    return (
      <View sx={{ alignItems: 'flex-start', flexDirection: 'row', gap: 12 }}>
        <CircularButton disabled={false}>{icon}</CircularButton>
        <CircularButton disabled={true}>{icon}</CircularButton>
      </View>
    )
  }

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ width: '100%', backgroundColor: 'transparent' }}
        contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}
        />
        {iconComponents.map((icon, index) => (
          <View
            key={index}
            style={{
              marginBottom: 16
            }}>
            {renderRow(icon)}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
