import {Subject} from 'rxjs';
import {TransferEvent} from './models';

export const transferEvent$ = new Subject<TransferEvent>();
