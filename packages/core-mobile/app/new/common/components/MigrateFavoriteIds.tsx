import { useMigrateFavoriteIds } from 'new/features/track/market/hooks/useMigrateFavoriteIds'

/**
 * This component is used to trigger the useMigrateFavoriteIds hook early in the app lifecycle.
 * This ensures that user favorites are migrated from coingeckoId to internalId format
 * as soon as the user is signed in, enabling proper push notification subscriptions
 * even if they don't visit the favorites tab.
 * It does not render anything.
 * @returns {null} Returns null as it doesn't render any UI.
 */
export const MigrateFavoriteIds = (): null => {
  useMigrateFavoriteIds()
  return null
}
