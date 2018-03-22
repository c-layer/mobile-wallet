import { Component } from '@angular/core';
import { Account } from '../../model/account';
import { CurrencyProvider } from '../../providers/currency';
import { NavController, NavParams } from 'ionic-angular';
import { AccountProvider } from '../../providers/account';
import { WalletSecureMode, WalletSecurePage } from '../wallet/wallet-secure/wallet-secure';
import { AccountToken } from '../../model/account-token';

@Component({
  selector: 'page-transfer',
  templateUrl: 'transfer.html'
})
export class TransferPage {
  activeAccount: Account;
  otherAccounts: Account[];

  public selectedGasPrice: number = 30000;
  public estimatedGas: number;

  public selectedTokenBalance: string;
  public selectedToken: AccountToken;
  public selectedCurrency: string;
  public selectedAmount: number;
  public selectedAccount: string;

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public currencyProvider: CurrencyProvider, public accountProvider: AccountProvider) {
  }

  getEstimatedFees() {
    let estimatedFees = '--- GWei';
    if (this.estimatedGas
      && new Number(this.selectedTokenBalance) >= this.selectedAmount) {
      let fees = (this.selectedGasPrice * this.estimatedGas);
      if (fees > 10 ** 9) {
        estimatedFees = (fees / 10 ** 9) + ' GWei';
      } else {
        estimatedFees = (fees / 10 ** 6) + ' MWei';
      }
    }
    return estimatedFees;
  }

  update() {
    if (this.selectedCurrency) {
      let currency = this.getCurrency();
      if (currency) {
        currency.getGasPrice().subscribe((data) => {
          if (data) {
            this.selectedGasPrice = data;
          }
        });
      }
    }

    if (this.selectedCurrency) {
      this.accountProvider.getActiveAccountPortfolio().forEach(token => {
        if (token.currency + ';' + token.network == this.selectedCurrency) {
          this.selectedTokenBalance = token.balance;
        }
      })
    }

    if (this.selectedAccount && this.selectedCurrency && this.selectedAmount
      && new Number(this.selectedTokenBalance) >= this.selectedAmount) {
      this.getCurrency().estimateTransfer(this.activeAccount, this.selectedAccount, this.selectedAmount)
        .subscribe((data) => {
          if (data) {
            this.estimatedGas = data;
          }
        });
    }
  }

  getCurrency() {
    if (this.selectedCurrency) {
      let data = this.selectedCurrency.split(';');
      if (data.length == 2) {
        return this.currencyProvider.getCurrencyBySymbol(data[1], data[0]);
      }
    }
    return null;
  }

  ionViewWillLoad() {
    let token = this.navParams.get('token');

    if (token) {
      this.selectedToken = token;
      this.selectedCurrency = token.currency + ';' + token.network;
    } else {
      let postivePortfolio = this.getPositivePortfolio();
      if(postivePortfolio.length > 0) {
        this.selectedToken = postivePortfolio[0];
        this.selectedCurrency =
          this.selectedToken.currency + ';' + this.selectedToken.network;
      }
    }
    this.activeAccount = this.accountProvider.getActiveAccount();
    this.otherAccounts = this.accountProvider.otherAccounts(this.activeAccount);

    this.update();
  }

  public transfer() {
    this.navCtrl.push(WalletSecurePage, {
      mode: WalletSecureMode.ELEVATE_PRIVS,
      callback: (password) => {
        return this.getCurrency().transfer(
          this.activeAccount,
          password,
          this.selectedAccount,
          this.selectedAmount
        );
      }
    });
    this.navCtrl.remove(1);
  }

  public cannotSubmit() {
    return !this.selectedCurrency || !this.selectedAmount
      || !this.selectedAccount || !this.selectedGasPrice
      || (new Number(this.selectedTokenBalance) < this.selectedAmount);
  }

  public scan() {
    this.navCtrl.parent.select(2);
  }

  public getPositivePortfolio() {
    return this.accountProvider.getActiveAccountPortfolio()
      .filter(element => new Number(element.balance) > 0);
  }
}
