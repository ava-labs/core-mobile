import { isSdkError } from '@avalabs/fusion-sdk'
import Logger from 'utils/Logger'

export const logSdkError = (tag: string, error: unknown): void => {
  Logger.error(tag, isSdkError(error) ? error.walk() : error)
}
