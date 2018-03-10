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
import { ProfileProvider } from '../../providers/profile';

@Component({
  selector: 'page-portfolio-details',
  templateUrl: 'portfolio-details.html',
})
export class PortfolioDetailsPage {
  activeAccount: Account = null;
  currency: Currency = new Currency();
  token: AccountToken = <AccountToken>{};
  supply: number = null;

  historyReady: boolean = false;
  progress: number = 0;
  history: Array<Transaction> = [];

  constructor(private accountProvider: AccountProvider,
    private currencyProvider: CurrencyProvider,
    private profileProvider: ProfileProvider,
    public formatProvider: FormatProvider,
    public navCtrl: NavController, public navParams: NavParams) {
  }

  activeAccountCanSend(token) {
    return this.accountProvider.accountCanSend(this.activeAccount, token.network, token.currency);
  }

  formatContractTransactions(transactions) {
    return this.token.transactions.map(transaction => {
      if(!transaction || !transaction.returnValues) {
        return;
      }

      let values = transaction.returnValues;
      let from = (values.from == this.activeAccount.address) ? null :
        this.formatProvider.formatAddress(values.from);
      let to = (values.to == this.activeAccount.address) ? null :
        this.formatProvider.formatAddress(values.to);

      let amount = values.value / 10 ** this.currency.decimal;
      if (this.token.currency == 'ETH') {
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

  formatCoreTransactions(network, transactions) {
    let sortedTxs = this.token.transactions.map(transaction => {
      let from = (transaction.from == this.activeAccount.address) ? null :
        this.formatProvider.formatAddress(transaction.from);
      let to = (transaction.to == this.activeAccount.address) ? null :
        this.formatProvider.formatAddress(transaction.to);

      let amount = Number.parseInt(transaction.value);
      amount += transaction.gas * transaction.gasPrice;
      if(this.currency.decimal > 8) {
        amount = Math.round(amount / (10**(this.currency.decimal - 8)));
        amount = amount / 10**8;
      } else {
        amount = amount / (10**this.currency.decimal);
      }

      return <Transaction>{
        hash: transaction.hash,
        timestamp: transaction.timestamp,
        blockNumber: transaction.blockNumber,
        amount: amount, from: from, to: to
      }
    }).sort((a, b) => {
      if (a.blockNumber < b.blockNumber) return -1;
      if (a.blockNumber > b.blockNumber) return 1;
      return 0;
    }).reverse();
    
    return sortedTxs;
  }

  startTransfer(token, event: FocusEvent) {
    event.stopPropagation();
    this.navCtrl.parent.parent.push(TransferPage, { token: token });
  }

  ionViewWillEnter() {
    this.activeAccount = this.accountProvider.getActiveAccount();
    this.token = this.navParams.get('token');
    this.currency = this.currencyProvider.getCurrencyBySymbol(this.token.network, this.token.currency);
    if (this.currency && this.currency.supply != undefined) {
      this.supply = this.currency.supply / 10 ** this.currency.decimal;
    }

    this.progress = 0;
    this.historyReady = false;
    if (this.currency && this.currency.isCore) {
      let start = (this.token.untilBlock) ? this.token.untilBlock : 0;
      this.historyReady = false;
      this.currency.history(this.activeAccount, start).subscribe(result => {
        if(result && result.block && result.block != 0) {
          this.progress = Math.floor((result.completion/result.block)*10000)/100;
        }

        if((result.block >= 0) && result.block == result.completion) {
          this.token.transactions = this.token.transactions.concat(result.transactions);
          this.token.untilBlock += result.block;
          this.history = this.formatCoreTransactions(result.network, this.token.transactions);
          this.historyReady = true;

          this.profileProvider.setPortfolio(this.activeAccount.portfolio);
        }
      });
    } else {
      this.historyReady = true;
      this.history = this.formatContractTransactions(this.token.transactions);
    }
  }

  ionViewDidLeave() {
    this.navCtrl.popToRoot();
  }
}
