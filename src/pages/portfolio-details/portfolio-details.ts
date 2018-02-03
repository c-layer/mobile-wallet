import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AccountProvider } from '../../providers/account';
import { FormatProvider } from '../../providers/format';
import { TransferPage } from "../transfer/transfer";
import { Transaction } from '../../model/transaction';
import { CurrencyProvider } from '../../providers/currency';
import { Currency } from '../../model/currency';
import { Account } from '../../model/account';
import { AccountToken } from '../../model/account-token';

@Component({
  selector: 'page-portfolio-details',
  templateUrl: 'portfolio-details.html',
})
export class PortfolioDetailsPage {
  activeAccount: Account = null;
  currency: Currency = new Currency();
  token: AccountToken = <AccountToken>{};
  supply: number = null;
  history: Array<Transaction> = [];

  constructor(private accountProvider: AccountProvider,
    private currencyProvider: CurrencyProvider,
    public formatProvider: FormatProvider,
    public navCtrl: NavController, public navParams: NavParams) {
  }

  activeAccountCanSend(currency) {
    return this.accountProvider.accountCanSend(this.activeAccount, currency);
  }

  startTransfer(token, event: FocusEvent) {
    event.stopPropagation();
    this.navCtrl.parent.parent.push(TransferPage, { token: token });
  }

  ionViewWillEnter() {
    this.activeAccount = this.accountProvider.getActiveAccount();
    this.token = this.navParams.get('token');
    this.currency = this.currencyProvider.getCurrencyBySymbol(this.token.currency);
    if(this.currency && this.currency.supply != undefined) {
      this.supply = this.currency.supply / 10** this.currency.decimal;
    }

    this.history = this.token.transactions.map(transaction => {
      let values = transaction.returnValues;
      let from = (values.from == this.activeAccount.address) ? null: 
        this.accountProvider.getAccountName(values.from);
      let to = (values.to == this.activeAccount.address) ? null: 
        this.accountProvider.getAccountName(values.to);

      let amount = values.value / 10 ** this.currency.decimal;
      if(this.token.currency == 'ETH') {
        amount = values.value;
      }
      return <Transaction>{
        hash: transaction.transactionHash,
        timestamp: null,
        blockNumber: transaction.blockNumber,
        amount: amount, from: from, to: to
      }
    }).sort((a, b) => {
      if (a.blockNumber < b.blockNumber) return -1;
      if (a.blockNumber > b.blockNumber) return 1;
      return 0;
    }).reverse();
  }
}
