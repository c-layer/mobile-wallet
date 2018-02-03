import { Component } from '@angular/core';
import { NavController, LoadingController } from 'ionic-angular';
import { NavParams } from 'ionic-angular/navigation/nav-params';
import { TabsPage } from '../../tabs/tabs';
import { AccountProvider } from '../../../providers/account';
import { WalletMnemonicPage } from '../wallet-mnemonic/wallet-mnemonic';
import { WalletCreationPage, WalletCreationMode } from '../wallet-creation/wallet-creation';
import { Scheduler } from 'rxjs';

export enum WalletSecureMode {
  UNLOCK, CREATE, ELEVATE_PRIVS
}

@Component({
  selector: 'page-wallet-secure',
  templateUrl: 'wallet-secure.html',
})
export class WalletSecurePage {
  public mode: WalletSecureMode = WalletSecureMode.CREATE;
  public walletSecureMode = WalletSecureMode;
  public title: string;
  public unlocking: boolean = false;
  public invalidPassword: boolean = false;

  public inputPasswordType: string = 'password';
  public inputConfirmationType: string = 'password';

  private mnemonic: string;
  private passphrase: string;

  private password: string;

  constructor(private navCtrl: NavController,
    private navParams: NavParams,
    private accountProvider: AccountProvider,
    public loadingCtrl: LoadingController) { }

  showInput(selector, event) {
    if (selector == 'password') {
      this.inputPasswordType =
        (['mousedown', 'touchstart'].indexOf(event.type) >= 0) ? 'text' : 'password';
    } else {
      this.inputConfirmationType =
        (['mousedown', 'touchstart'].indexOf(event.type) >= 0) ? 'text' : 'password';
    }
  }

  submit() {
    if (!this.mnemonic) {
      this.navCtrl.push(WalletMnemonicPage, { password: this.password });
    } else {
      let mnemonicIsBackup = this.navParams.get('mnemonicIsBackup');
      this.navCtrl.setRoot(WalletCreationPage, {
        mode: WalletCreationMode.RECOVER,
        password: this.password,
        mnemonic: this.mnemonic,
        mnemonicIsBackup: mnemonicIsBackup,
        passphrase: this.passphrase
      });
    }
  }

  unlock() {
    this.invalidPassword = false;
    this.unlocking = true;
    this.accountProvider.unlock(this.password).first().subscribe((result) => {
      this.unlocking = false;
      if (result) {
        this.navCtrl.push(TabsPage);
      } else {
        this.invalidPassword = true;
      }
    });
  }

  elevatePrivileges() {
    let callback = this.navParams.get('callback');
    if (callback) {
      this.unlocking = true;
      console.log('Raising privileges !');
      Scheduler.async.schedule(() => {
        callback(this.password).first().subscribe(() => {
          console.log('Lower down privileges');
          this.unlocking = false;
          this.navCtrl.pop();
        });
      }, 100);
    }
  }

  ionViewWillEnter() {
    this.mode = this.navParams.get('mode');
    if (!this.mode) {
      this.mode = WalletSecureMode.UNLOCK;
    }

    this.mnemonic = this.navParams.get('mnemonic');
    this.passphrase = this.navParams.get('passphrase');

    switch (this.mode) {
      case WalletSecureMode.CREATE:
        this.title = 'Wallet creation';
        break;
      case WalletSecureMode.UNLOCK:
        this.title = 'Login';
        break;
      case WalletSecureMode.ELEVATE_PRIVS:
        this.title = 'Authorize';
        break;
    }
  }
}
