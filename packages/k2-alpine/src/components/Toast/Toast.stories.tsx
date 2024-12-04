import React from 'react'
import { ScrollView, View } from '../Primitives'
import { NotificationAlert, NotificationAlertType, useTheme } from '../..'
import { Snackbar } from './Snackbar'

export default {
  title: 'Toasts'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const notificationAlertTypes: NotificationAlertType[] = [
    'info',
    'success',
    'criticalError',
    'error',
    'suspicious',
    'scam'
  ]

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ width: '100%', backgroundColor: 'transparent' }}
        contentContainerStyle={{ padding: 16, gap: 16, alignItems: 'center' }}>
        <Snackbar message="Code copied" />
        {notificationAlertTypes.map((type, index) => (
          <NotificationAlert
            key={index}
            type={type}
            title="Alert Header"
            message="Nullam vel urna ac massa pretium tristique. Curabitur eleifend ac diam vitae varius"
          />
        ))}
        {notificationAlertTypes.map((type, index) => (
          <NotificationAlert key={index} type={type} title="Alert Header" />
        ))}
      </ScrollView>
    </View>
  )
}
