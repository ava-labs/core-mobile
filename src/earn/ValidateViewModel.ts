import {MnemonicWallet} from '../../wallet_sdk'
import {BehaviorSubject, EMPTY, interval, Observable, Subscription, throwError, zip} from 'rxjs'
import moment from 'moment'
import {concatMap, map, take} from "rxjs/operators"

export default class {
  private intervalSub!: Subscription
  wallet!: BehaviorSubject<MnemonicWallet>
  loaderVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  loaderMsg: BehaviorSubject<string> = new BehaviorSubject<string>("")
  /**
   * Start date is always set 5min from time when staking is initiated
   */
  startDate: BehaviorSubject<Date> = new BehaviorSubject<Date>(moment().add(5, 'minutes').toDate())
  /**
   * End date is initially set to 3 weeks from now
   */
  endDate: BehaviorSubject<Date> = new BehaviorSubject<Date>(moment().add(3, 'weeks').toDate())
  stakingDuration: Observable<string>
  endDatePickerVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)

  constructor(wallet: MnemonicWallet) {
    this.wallet = new BehaviorSubject<MnemonicWallet>(wallet)

    this.stakingDuration = zip(this.startDate, this.endDate).pipe(
      map(([startDate, endDate]) => moment.duration(moment(endDate).diff(moment(startDate)))),
      map(duration => duration.get('days') + " days " + duration.get('hours') + " hours " + duration.get('minutes') + " minutes")
    )

    this.intervalSub = interval(1000).pipe(
      map(() => moment().add(moment.duration(5, 'minutes')).toDate())
    ).subscribe()
  }

  cleanup(): void {
    this.intervalSub?.unsubscribe()
  }

  setEndDate(date: Date): Observable<never> {
    return this.startDate.pipe(
      take(1),
      concatMap(startDate => {
        const endDate = moment(date)
        const duration = moment.duration(endDate.diff(startDate))
        const minDuration = moment.duration(2, 'weeks')
        if (duration < minDuration) {
          return throwError(() => Error("Min staking period is 2 weeks"))
        }
        this.endDate.next(date)
        return EMPTY
      })
    )
  }
}
