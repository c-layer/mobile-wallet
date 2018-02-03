import { Account } from './account';
import { Transaction } from './transaction';
import { Observable } from 'rxjs/Observable';

export class Currency {
  name: string;
  decimal: number;
  address: string;
  contract: any;
  supply: number;
  symbol: string;
  image: string;
  balanceOf(account: Account): Observable<number> { return null; };
  transfer(sender: Account, password: string, beneficiaryAddress: string, amount: number): Observable<Transaction> { return null; }
}
