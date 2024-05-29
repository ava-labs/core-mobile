import React from 'react'
import { withBackgrounds } from '@storybook/addon-ondevice-backgrounds'
import { NavigationContainer } from '@react-navigation/native'
import { ReactQueryProvider } from 'contexts/ReactQueryProvider'
import { K2ThemeProvider } from '@avalabs/k2-mobile'
import { EncryptedStoreProvider } from '../app/contexts/EncryptedStoreProvider'
import { ApplicationContextProvider } from '../app/contexts/ApplicationContext'
import { PosthogContextProvider } from '../app/contexts/PosthogContext'
import { COLORS_NIGHT, COLORS_DAY } from '../app/resources/Constants'

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
      { name: 'night', value: COLORS_NIGHT.background },
      { name: 'day', value: COLORS_DAY.background }
    ]
  }
}

const withProviders = Story => (
  <EncryptedStoreProvider>
    <ReactQueryProvider>
      <PosthogContextProvider>
        <K2ThemeProvider>
          <ApplicationContextProvider>
            <NavigationContainer>
              <Story />
            </NavigationContainer>
          </ApplicationContextProvider>
        </K2ThemeProvider>
      </PosthogContextProvider>
    </ReactQueryProvider>
  </EncryptedStoreProvider>
)

export const decorators = [withBackgrounds, withProviders]
