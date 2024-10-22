import React from 'react'
import { View, Text } from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'components/navigation/BlurredBarsContentLayout'

const ContactsHomeScreen = (): JSX.Element => {
  return (
    <BlurredBarsContentLayout>
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
    </BlurredBarsContentLayout>
  )
}

export default ContactsHomeScreen
