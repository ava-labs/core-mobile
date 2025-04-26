import React from 'react'
import { ScrollView, View, Text } from '../Primitives'
import { NotificationAlert, NotificationAlertType, useTheme } from '../..'
import { Snackbar } from './Snackbar'
import { TransactionSnackbar } from './TransactionSnackbar'

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
        <Text variant="heading6">Snackbar</Text>
        <Snackbar message="Code copied" />
        <Text variant="heading6">Transaction Snackbar</Text>
        <TransactionSnackbar type="pending" />
        <TransactionSnackbar type="success" isActionable={true} />
        <TransactionSnackbar type="success" message="Stake reward claimed!" />
        <TransactionSnackbar
          type="success"
          message="Super long message message message message message message message message message message message message"
        />
        <TransactionSnackbar type="error" isActionable={true} />
        <TransactionSnackbar
          type="error"
          message="Transaction failed with no action"
          isActionable={false}
        />

        <Text variant="heading6">Notification Alert</Text>
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
