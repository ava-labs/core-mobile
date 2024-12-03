import React from 'react'
import { ScrollView, View } from '../Primitives'
import { NotificationAlert, NotificationAlertType, useTheme } from '../..'
import { Snackbar } from './Snackbar'

export default {
  title: 'Notifications Alerts'
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
        style={{ width: '100%', backgroundColor: 'transparent' }}
        contentContainerStyle={{ padding: 16, gap: 16, alignItems: 'center' }}>
        <Snackbar message="Code copied" />
        {[
          NotificationAlertType.Info,
          NotificationAlertType.Success,
          NotificationAlertType.CriticalError,
          NotificationAlertType.Error,
          NotificationAlertType.Suspicious,
          NotificationAlertType.Scam
        ].map(type => (
          <NotificationAlert
            type={type}
            title="Alert Header"
            message="Nullam vel urna ac massa pretium tristique. Curabitur eleifend ac diam vitae varius"
          />
        ))}
        {[
          NotificationAlertType.Info,
          NotificationAlertType.Success,
          NotificationAlertType.CriticalError,
          NotificationAlertType.Error,
          NotificationAlertType.Suspicious,
          NotificationAlertType.Scam
        ].map(type => (
          <NotificationAlert type={type} title="Alert Header" />
        ))}
      </ScrollView>
    </View>
  )
}
