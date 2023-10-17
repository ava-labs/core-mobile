import startCase from 'lodash/startCase'
/**
 * humanize a string
 * - delete leading underscores, if any.
 * - replace underscores with spaces, if any.
 * - capitalize the first character of each word.
 *
 * for example: "some_string" to "Some String"
 */
export const humanize = (value: string) => {
  return startCase(value)
}
