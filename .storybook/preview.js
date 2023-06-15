
import React from 'react';
import { withBackgrounds } from '@storybook/addon-ondevice-backgrounds';
import { EncryptedStoreProvider } from '../app/contexts/EncryptedStoreProvider'
import { ApplicationContextProvider } from '../app/contexts/ApplicationContext'
import { PosthogContextProvider } from '../app/contexts/PosthogContext'
import { COLORS_NIGHT, COLORS_DAY } from '../app/resources/Constants'

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  backgrounds: {
    default: 'night',
    values: [
      { name: 'night', value: COLORS_NIGHT.background },
      { name: 'day', value: COLORS_DAY.background }
    ]
  }
};

const withProviders = (Story) => (
  <EncryptedStoreProvider>
    <PosthogContextProvider>
      <ApplicationContextProvider>
        <Story />
      </ApplicationContextProvider>
    </PosthogContextProvider>
  </EncryptedStoreProvider>
)

export const decorators = [withBackgrounds, withProviders];



