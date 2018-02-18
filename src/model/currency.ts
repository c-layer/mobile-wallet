import { Account } from './account';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs';

export class Currency {
  name: string;
  network: string;
  decimal: number;
  address: string;
  contract: any;
  supply: number;
  symbol: string;
  image: string;
  isCore: boolean;
  balanceOf(account: Account): Observable<number> { return null; };
  history(account: Account, start: number): BehaviorSubject<any> { return null; };
  transfer(sender: Account, password: string,
    beneficiaryAddress: string, amount: number): Observable<any> { return null; }
  estimateTransfer(sender: Account, beneficiaryAddress: string, amount: number): Observable<any> { return null; }
  getGasPrice(): Observable<any> { return null; }
}
