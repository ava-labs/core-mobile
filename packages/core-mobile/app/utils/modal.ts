import RootSiblingsManager from 'react-native-root-siblings'
import Logger from 'utils/Logger'

let rootNode: RootSiblingsManager | null = null

export const showModal = (element: JSX.Element): void => {
  // if there is already a modal shown, hide it first
  if (rootNode !== null) {
    Logger.warn(
      'duplicate logo modal',
      'there is already a modal shown, you should hide it first'
    )
    return
  }
  rootNode = new RootSiblingsManager(element)
}

export const hideModal = (): void => {
  rootNode?.destroy()
  rootNode = null
}
