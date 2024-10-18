import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'
import useHomeScreenHeader from '../../../../hooks/useHomeScreenHeader'

const ContactsHomeScreen = (): JSX.Element => {
  useHomeScreenHeader()

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
      }}>
      <Text variant="heading3" sx={{ color: 'black' }}>
        Contacts
      </Text>
    </View>
  )
}

export default ContactsHomeScreen
