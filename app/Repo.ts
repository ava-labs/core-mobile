import { useViewOnceInformation } from 'store/viewOnceInformation'

export type Repo = {
  flush: () => void
}

export function useRepo(): Repo {
  const viewOnceInformation = useViewOnceInformation()

  const flush = () => {
    viewOnceInformation.reset()
  }

  return {
    flush
  }
}
