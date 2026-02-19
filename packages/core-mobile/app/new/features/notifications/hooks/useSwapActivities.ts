import { swapActivitiesStore } from '../store'
import { SwapActivityItem } from '../types'

export function useSwapActivities(): { swapActivities: SwapActivityItem[] } {
  const swapActivities = swapActivitiesStore(state => state.swapActivities)
  return { swapActivities }
}

export function removeSwapActivity(id: string): void {
  swapActivitiesStore.getState().removeSwapActivity(id)
}

export function clearCompletedSwapActivities(): void {
  swapActivitiesStore.getState().clearCompletedSwapActivities()
}

export function saveSwapActivity(item: SwapActivityItem): void {
  swapActivitiesStore.getState().saveSwapActivity(item)
}
