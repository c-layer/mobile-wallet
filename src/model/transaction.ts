import { Account } from './account';

export class Transaction {
  hash: string
  blockNumber: number;
  timestamp: number;
  amount: number;
  from: string;
  accountFrom: Account;
  to: string;
  accountTo: Account;
}
