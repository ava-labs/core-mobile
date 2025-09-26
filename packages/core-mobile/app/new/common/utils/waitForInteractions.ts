import { InteractionManager } from 'react-native'

export const waitForInteractions = (): Promise<void> =>
  new Promise<void>(resolve => {
    InteractionManager.runAfterInteractions(() => resolve())
  })
