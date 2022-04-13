import { Observable } from 'rxjs'

export type Account = {
  index: number
  title: string
  address: string
  active: boolean
  balance$: Observable<string>
}
