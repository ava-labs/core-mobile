import { useViewOnceInformation } from 'store/viewOnceInformation'

export type AccountId = number
export type UID = string

export type Contact = {
  address: string
  addressBtc: string
  title: string
  id: string
}

export type RecentContact = {
  id: AccountId | UID
  type: AddrBookItemType
}

export type AddrBookItemType = 'account' | 'contact'

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
