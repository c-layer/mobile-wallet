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
import { ExplorerProvider } from '../../providers/explorer';

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
  hasErrors: boolean = false;
  history: Array<Transaction> = [];

  constructor(private accountProvider: AccountProvider,
    private currencyProvider: CurrencyProvider,
    public formatProvider: FormatProvider,
    private profileProvider: ProfileProvider,
    public navCtrl: NavController, public navParams: NavParams) {
  }

  getMaxTrie() {
    return ExplorerProvider.MAX_TRIE;
  }

  activeAccountCanSend(token) {
    return this.accountProvider.accountCanSendSymbol(this.activeAccount, token.network, token.currency);
  }

  formatContractTransactions(transactions) {
    return this.token.transactions.map(transaction => {
      if (!transaction || !transaction.returnValues) {
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
        time: null,
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

      if (to) {
        amount += transaction.gas * transaction.gasPrice;
      }

      if (this.currency.decimal > 8) {
        amount = Math.round(amount / (10 ** (this.currency.decimal - 8)));
        amount = amount / 10 ** 8;
      } else {
        amount = amount / (10 ** this.currency.decimal);
      }
      return <Transaction>{
        hash: transaction.hash,
        time: this.formatProvider.formatTimeAgo(transaction.timestamp),
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
    this.hasErrors = false;
    this.activeAccount = this.accountProvider.getActiveAccount();

    let tokenParam = this.navParams.get('token');
    let portfolio = this.accountProvider.getActiveAccountPortfolio();
    portfolio.forEach(portfolioToken => {
      if (portfolioToken.currency == tokenParam.currency
        && portfolioToken.network == tokenParam.network) {
        this.token = portfolioToken;
      }
    });

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
        if (result.errors > 0) {
          this.historyReady = true;
          this.hasErrors = true;
          return;
        }

        if (result && result.block && result.block != 0) {
          if(result.block == result.start) {
            this.progress = 100;
          } else {
            this.progress = Math.floor((result.completion / (result.block - result.start)) * 10000) / 100;
          }
        }

        if ((result.block >= 0) && this.progress == 100) {
          let transactions = [];
          this.token.transactions.forEach(tx => {
            if(tx.blockNumber > (result.start - ExplorerProvider.MAX_TRIE)) {
              transactions.push(tx);
            }
          });
          this.token.transactions = transactions.concat(result.transactions);
          this.token.untilBlock = result.start + result.completion;
          this.history = this.formatCoreTransactions(result.network, this.token.transactions);
          this.historyReady = true;

          this.accountProvider.setActiveAccountPortfolio(portfolio);
          this.profileProvider.saveProfile();
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
