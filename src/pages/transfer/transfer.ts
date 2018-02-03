import { Component } from '@angular/core';
import { Account } from '../../model/account';
import { CurrencyProvider } from '../../providers/currency';
import { NavController, NavParams } from 'ionic-angular';
import { AccountProvider } from '../../providers/account';
import { WalletSecureMode, WalletSecurePage } from '../wallet/wallet-secure/wallet-secure';
import { Transaction } from '../../model/transaction';
import { AccountToken } from '../../model/account-token';

@Component({
  selector: 'page-transfer',
  templateUrl: 'transfer.html'
})
export class TransferPage {
  activeAccount: Account;
  otherAccounts: Account[];

  public selectedToken: AccountToken;
  public selectedCurrency: string;
  public selectedAmount: number;
  public selectedAccount: string;

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public currencyProvider: CurrencyProvider, public accountProvider: AccountProvider) {
  }

  ionViewWillLoad() {
    let token = this.navParams.get('token');

    if (token) {
      this.selectedToken = token;
      this.selectedCurrency = token.currency;
    }
    this.activeAccount = this.accountProvider.getActiveAccount();
    this.otherAccounts = this.accountProvider.otherAccounts(this.activeAccount);
  }

  public transfer() {
    let currency = this.currencyProvider.getCurrencyBySymbol(this.selectedCurrency);
    this.navCtrl.push(WalletSecurePage, {
      mode: WalletSecureMode.ELEVATE_PRIVS,
      callback: (password) => {
        return currency.transfer(
          this.activeAccount,
          password,
          this.selectedAccount,
          this.selectedAmount
        );
      }
    });
    this.navCtrl.remove(1);
  }

  public scan() {
    this.navCtrl.parent.select(2);
  }

  public getPositivePortfolio() {
    return this.activeAccount.portfolio.filter(element => element.balance > 0);
  }
}
