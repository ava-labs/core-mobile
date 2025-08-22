import { InteractionManager } from 'react-native'

export const runAfterInteractions = <T>(
  fn: () => Promise<T> | void
): Promise<T | void> =>
  new Promise((resolve, reject) => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        const result = await fn()
        resolve(result)
      } catch (e) {
        reject(e)
      }
    })
  })
