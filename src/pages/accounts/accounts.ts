import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AccountProvider } from '../../providers/account';
import { Account, AccountType } from '../../model/account';
import { AccountDetailsPage } from '../details/account-details/account-details';
import { WalletSecureMode, WalletSecurePage } from '../wallet/wallet-secure/wallet-secure';

@Component({
  selector: 'page-accounts',
  templateUrl: 'accounts.html',
})
export class AccountsPage {
  accounts: Account[] = [];
  activeAccount: Account;

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public accountProvider: AccountProvider) {
  }

  hasPrivateKey(account) {
    return account.type != AccountType.PUBLIC;
  }

  createAccount() {
    this.navCtrl.parent.parent.push(WalletSecurePage, { 
      mode: WalletSecureMode.ELEVATE_PRIVS,
      callback: (password) => {
        let account = this.accountProvider.addAccount(undefined, password);
        return account;
      }})
  }

  goToDetailsPage(event, account) {
    event.stopPropagation();
    this.navCtrl.push(AccountDetailsPage, { account: account });
  }

  selectAccount(event, account) {
    event.stopPropagation();
    this.accountProvider.setActive(account);
    this.navCtrl.parent.select(0);
  }

  getDeterministicWalletAccounts() {
    return this.accounts.filter(account => {
      return (account.derivationId != null);
    });
  }

  hasExternalAccounts() {
    return this.getExternalAccounts().length > 0;
  }
  
  getExternalAccounts() {
    return this.accounts.filter(account => {
      return (account.derivationId == null);
    });
  }
 
  ionViewWillEnter() {
    this.accounts = this.accountProvider.getAccounts();
  }
}
