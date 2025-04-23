import _ from 'lodash'

/**
 * Formats a string into sentence case.
 *
 * - Capitalizes the first letter of the string.
 * - Converts the rest of the string to lowercase.
 *
 * Example:
 *   "ENABLE FEATURE X" → "Enable feature x"
 *   "some Text Here"   → "Some text here"
 *
 * Useful for normalizing labels or displaying user-friendly text in the UI.
 */
export const sentenceCase = (input: string): string => {
  const lower = _.toLower(input)
  return _.upperFirst(lower)
}
