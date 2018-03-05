import { Account } from './account';
import { Transaction } from './transaction';
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
  balanceOf(account: Account): Observable<string> { return null; };
  history(account: Account): BehaviorSubject<any> { return null; };
  transfer(sender: Account, password: string, beneficiaryAddress: string, amount: number): Observable<Transaction> { return null; }
}
