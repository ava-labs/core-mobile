import { useMemo } from 'react'

export const useGetInitials = (name?: string): string => {
  return useMemo(() => {
    const names = (name ?? '').split(' ')
    const length = names.length

    return length > 1
      ? `${names[0]?.substring(0, 1) ?? ''}${
          names[length - 1]?.substring(0, 1) ?? ''
        }`
      : names[0]?.substring(0, 1) ?? ''
  }, [name])
}
