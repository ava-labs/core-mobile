import { CORE_MOBILE_META } from '../types'

export const isExternalDappUrl = (url?: string): boolean => {
  return Boolean(url) && url !== CORE_MOBILE_META.url
}
