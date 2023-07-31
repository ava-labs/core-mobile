import Logger from './Logger'

export function mustValue<T>(func: () => T, failValue: T) {
  try {
    return func()
  } catch (e) {
    Logger.error('mustValue', e)
    return failValue
  }
}

export function mustNumber(func: () => number, failValue: number) {
  const f = func()
  if (isNaN(f)) {
    return failValue
  }
  return f
}
