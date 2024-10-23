import { registerRootComponent } from 'expo'

export function init(): void {
  registerRootComponent(require('../.storybook').default)
}
