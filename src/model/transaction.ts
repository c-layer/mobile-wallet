import { Account } from './account';

export class Transaction {
  hash: string
  blockNumber: number;
  time: string;
  amount: number;
  from: string;
  accountFrom: Account;
  to: string;
  accountTo: Account;
}
