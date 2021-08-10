/**
 * Context wrapper for App
 **/

import React from 'react';
import App from 'App';
import {ApplicationContextProvider} from 'contexts/applicationContext';

export default function ContextApp() {
  return (
    <ApplicationContextProvider>
      <App />
    </ApplicationContextProvider>
  );
}
