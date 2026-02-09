/**
 * Custom router module that wraps expo-router's useRouter with throttling
 * for modal routes to prevent double-tap navigation issues.
 *
 * This module is used via Metro's resolveRequest to redirect expo-router
 * imports from app/new/** to this module, making the throttling automatic
 * for all navigation in the new app folder.
 *
 * IMPORTANT: This module imports from 'expo-router-original' which is
 * resolved by Metro to the actual expo-router package.
 */

// Re-export everything from the original expo-router
// Using wildcard to ensure all exports are available
export * from 'expo-router-original'

// Export our throttled useRouter
export { useSafeRouter as useRouter } from 'common/hooks/useSafeRouter'
