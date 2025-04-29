import React from 'react'
import { withBackgrounds } from '@storybook/addon-ondevice-backgrounds'
import { NavigationContainer } from '@react-navigation/native'
import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { ReactQueryProvider } from '../app/new/common/contexts/ReactQueryProvider'
import { EncryptedStoreProvider } from '../app/new/common/contexts/EncryptedStoreProvider'
import { PosthogContextProvider } from '../app/new/common/contexts/PosthogContext'

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/
    }
  },
  backgrounds: {
    default: 'night',
    values: [
      { name: 'night', value: '#000000' },
      { name: 'day', value: '#FFFFFF' }
    ]
  }
}

const withProviders = Story => (
  <EncryptedStoreProvider>
    <ReactQueryProvider>
      <PosthogContextProvider>
        <K2AlpineThemeProvider>
          <NavigationContainer>
            <Story />
          </NavigationContainer>
        </K2AlpineThemeProvider>
      </PosthogContextProvider>
    </ReactQueryProvider>
  </EncryptedStoreProvider>
)

export const decorators = [withBackgrounds, withProviders]
