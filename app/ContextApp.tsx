/**
 * Context wrapper for App
 **/

import React from 'react';
import App from 'App';
import {ApplicationContextProvider} from 'contexts/ApplicationContext';

export default function ContextApp() {
  return (
    <ApplicationContextProvider>
      <App />
    </ApplicationContextProvider>
  );
}
