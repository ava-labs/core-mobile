
import React from 'react';
import { EncryptedStoreProvider } from '../app/contexts/EncryptedStoreProvider'
import { ApplicationContextProvider } from '../app/contexts/ApplicationContext'
import { PosthogContextProvider } from '../app/contexts/PosthogContext'

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const decorators = [
    (Story) => (
      <EncryptedStoreProvider>
        <PosthogContextProvider>
          <ApplicationContextProvider>
            <Story />
          </ApplicationContextProvider>
        </PosthogContextProvider>
      </EncryptedStoreProvider>
    )
  ]
