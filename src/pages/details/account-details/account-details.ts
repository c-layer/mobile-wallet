import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { SocialSharing } from '@ionic-native/social-sharing';
import { FormatProvider } from '../../../providers/format';
import { TransferPage } from "../../transfer/transfer";
import { Account } from '../../../model/account';
import { AccountProvider } from '../../../providers/account';
import { WalletSecurePage, WalletSecureMode } from '../../wallet/wallet-secure/wallet-secure';

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

  @ViewChild('qrcode')
  qrcodeImg: ElementRef;

  constructor(public formatProvider: FormatProvider,
    public navCtrl: NavController, public navParams: NavParams,
    private socialSharing: SocialSharing,
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

  accountCanSend() {
    let active = this.accountProvider.getActiveAccount();
    return this.account != active
      && this.accountProvider.accountCanSend(active);
  }

  shareTo() {
    let image = null;
    if (this.qrcodeImg && this.qrcodeImg['qrcElement']) {
      image = this.qrcodeImg['qrcElement'].nativeElement.firstChild.currentSrc;
    }
    this.socialSharing.share(this.account.address, '[MtWallet] My Public Address', 
      image, 
      'https://play.google.com/store/apps/details?id=tech.smex.mtpelerin.wallet')
      .then(result => {
        this.loading = false;
        console.log(result);
      }).catch(error => {
        this.loading = false;
        console.error(error);
      });
    this.loading = true;
  }

  delete() {
    this.navCtrl.parent.parent.push(WalletSecurePage, {
      mode: WalletSecureMode.ELEVATE_PRIVS,
      callback: (password) => {
        let profile = this.accountProvider.removeAccount(this.account, password);
        this.navCtrl.remove(1);
        return profile;
      }
    })
  }

  sendTo() {
    this.navCtrl.parent.parent.push(TransferPage);
  }

  ionViewWillEnter() {
    this.account = this.navParams.get('account');
    this.name = this.account.name;
    this.title = this.account.name;
  }

  ionViewDidLeave() {
    this.navCtrl.popToRoot();
  }
}
