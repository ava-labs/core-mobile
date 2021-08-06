import {
  asyncScheduler,
  BehaviorSubject,
  combineLatest,
  concat,
  defer,
  EMPTY,
  interval,
  Observable,
  of,
  Subscription,
  throwError,
  zip,
} from 'rxjs';
import moment from 'moment';
import {concatMap, count, map, take, tap} from 'rxjs/operators';
import {BN, MnemonicWallet, Utils} from '@avalabs/avalanche-wallet-sdk';

declare type ValidatorInputs = {
  nodeId: string;
  amount: BN;
  startDate: Date;
  endDate: Date;
  delegationFee: number;
  rewardAddress: string;
};

export default class {
  private intervalSub!: Subscription;
  wallet!: BehaviorSubject<MnemonicWallet>;
  loaderVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  loaderMsg: BehaviorSubject<string> = new BehaviorSubject<string>('');
  /**
   * Start date is always set 5min from time when staking is initiated
   */
  startDate: BehaviorSubject<Date> = new BehaviorSubject<Date>(
    moment().add(5, 'minutes').toDate(),
  );
  /**
   * End date is initially set to 3 weeks from now
   */
  endDate: BehaviorSubject<Date> = new BehaviorSubject<Date>(
    moment().add(3, 'weeks').toDate(),
  );
  stakingDuration: Observable<string>;
  endDatePickerVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false,
  );

  constructor(wallet: MnemonicWallet) {
    this.wallet = new BehaviorSubject<MnemonicWallet>(wallet);

    this.stakingDuration = combineLatest([this.startDate, this.endDate]).pipe(
      map(([startDate, endDate]) =>
        moment.duration(moment(endDate).diff(moment(startDate))),
      ),
      map(
        duration =>
          Math.floor(duration.asDays()) +
          ' days ' +
          duration.get('hours') +
          ' hours ' +
          duration.get('minutes') +
          ' minutes',
      ),
    );

    this.intervalSub = interval(1000)
      .pipe(map(() => moment().add(moment.duration(5, 'minutes')).toDate()))
      .subscribe();
  }

  cleanup(): void {
    this.intervalSub?.unsubscribe();
  }

  setEndDate(date: Date): Observable<never> {
    return this.startDate.pipe(
      take(1),
      concatMap(startDate => {
        const endDate = moment(date);
        const duration = moment.duration(endDate.diff(startDate));
        const minDuration = moment.duration(2, 'weeks');
        if (duration < minDuration) {
          return throwError(() => Error('Min staking period is 2 weeks'));
        }
        this.endDate.next(date);
        return EMPTY;
      }),
    );
  }

  submitValidator(
    nodeId: string,
    amount: string,
    startDate: string,
    endDate: string,
    delegationFee: string,
    rewardAddress: string,
  ): Observable<number> {
    return zip(
      this.wallet,
      this.validateAndConvertInputs(
        nodeId,
        amount,
        startDate,
        endDate,
        delegationFee,
        rewardAddress,
      ),
    ).pipe(
      take(1),
      concatMap(([wallet, inputs]) => {
        return concat(
          of('start loader'),
          defer(() =>
            wallet.validate(
              inputs.nodeId,
              inputs.amount,
              inputs.startDate,
              inputs.endDate,
              inputs.delegationFee,
              inputs.rewardAddress,
            ),
          ),
          asyncScheduler,
        );
      }),
      count((value: string, index: number) => {
        this.setLoaderVisibilityAndMsg(index);
        return true;
      }),
      tap({
        complete: () => this.loaderVisible.next(false),
        error: err => this.loaderVisible.next(false),
      }),
    );
  }

  private setLoaderVisibilityAndMsg(index: number) {
    switch (index) {
      case 0:
        this.loaderMsg.next('Pending...');
        break;
    }
    this.loaderVisible.next(true);
  }

  private validateAndConvertInputs(
    nodeId: string,
    amount: string,
    startDate: string,
    endDate: string,
    delegationFee: string,
    rewardAddress: string,
  ): Observable<ValidatorInputs> {
    return defer(() =>
      of({
        nodeId: nodeId, //todo validate this?
        amount: Utils.numberToBN(amount, 9), //fixme  magic number
        startDate: moment(startDate).toDate(),
        delegationFee: parseInt(delegationFee),
        endDate: moment(endDate).toDate(),
        rewardAddress: rewardAddress, //todo validate this?
      }),
    );
  }
}
