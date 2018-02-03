import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { FormatProvider } from '../../../providers/format';
import { TransferPage } from "../../transfer/transfer";
import { Account } from '../../../model/account';
import { AccountProvider } from '../../../providers/account';

@Component({
  selector: 'page-account-details',
  templateUrl: 'account-details.html',
})
export class AccountDetailsPage {
  showKey: string = "address";
  account: Account = null;
  name: string = null;
  loading: boolean = false;
  title: string = "";

  scannedCode = null;
  renaming: boolean = false;

  constructor(public formatProvider: FormatProvider,
    public navCtrl: NavController, public navParams: NavParams,
    public accountProvider: AccountProvider) {
  }

  startTransfer(token, event: FocusEvent) {
    event.stopPropagation();
    this.navCtrl.push(TransferPage, { token });
  }

  close($event) {
    if ($event.path[1].id == 'content') {
      this.navCtrl.pop();
    }
  }

  rename() {
    this.loading = true;
    this.accountProvider.setAccountName(this.account, this.name).map(() => {
      this.title = this.name;
      this.renaming = false;
      this.loading = false;
    }).subscribe();
  }

  startRename() {
    this.renaming = true;
  }

  cancelRename() {
    this.renaming = false;
  }

  ionViewWillEnter() {
    this.account = this.navParams.get('account');
    this.name = this.account.name;
    this.title = this.account.name;
  }
}
