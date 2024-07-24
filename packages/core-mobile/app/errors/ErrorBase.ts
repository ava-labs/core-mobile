/**
 * This is base class for creating Error groups
 *
 * Example:
 * export class MyErrors extends ErrorBase<PossibleGroupErrorNames> {}
 *
 * type PossibleGroupErrorNames =
 *   | 'ERROR_TYPE_1'
 *   | 'ERROR_TYPE_2'
 *
 * ... then throw it somewhere ...
 * throw new MyErrors({
 *   name: 'ERROR_TYPE_1',
 *   message: 'Custom message'
 * })
 *
 * ... and catch it ...
 * } catch (e) {
 *   if (error instanceof MyErrors) {
 *     switch (error.name) {
 *       case 'ERROR_TYPE_1':
 *       case 'ERROR_TYPE_2':
 *     }
 *   }
 * }
 *
 * Notes:
 * If you don't want to enforce name(s) of the error,
 * when extending this class, you can just do ErrorBase<string>.
 * The error will then use the constructor name as the error name.
 */
export class ErrorBase<T extends string> extends Error {
  name: string
  cause?: unknown

  constructor({
    name,
    message,
    cause
  }: {
    name?: T
    message: string
    cause?: unknown
  }) {
    super(message)
    this.name = name ?? this.constructor.name
    this.cause = cause
  }
}
