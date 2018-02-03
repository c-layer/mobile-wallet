import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { NavController, NavParams } from 'ionic-angular';
import { ProfileProvider } from '../../providers/profile';
import { AccountProvider } from '../../providers/account';
import { LandingPage } from '../landing/landing';
import { WalletMnemonicPage } from '../wallet/wallet-mnemonic/wallet-mnemonic';
import { WalletSecurePage, WalletSecureMode } from '../wallet/wallet-secure/wallet-secure';
import { Observable } from 'rxjs/Observable';
import { Profile } from '../../model/profile';
import { LoaderProvider } from '../../providers/loader';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {
  public loadingSteps: any[];
  public profile: Profile = <Profile>{ };
  public confirmations: number = 3;

  constructor(private platform: Platform, private profileProvider: ProfileProvider,
    public accountProvider: AccountProvider,
    public loaderProvider: LoaderProvider,
    public navCtrl: NavController, public navParams: NavParams) {
  }

  backupMnemonic() {
    this.navCtrl.parent.parent.push(WalletSecurePage, {
      mode: WalletSecureMode.ELEVATE_PRIVS,
      callback: (password) => {
        return Observable.fromPromise(new Promise(() => {
        let mnemonic = this.accountProvider.readMnemonic(password);
        this.navCtrl.parent.parent.push(WalletMnemonicPage, { mnemonic: mnemonic, 
          update: () => {
            let profile = this.profileProvider.getProfile();
            return this.profileProvider.setMnemonicIsBackUp();
          } 
        });
        this.navCtrl.parent.parent.remove(1);
        return null;
        }));
      }
    });
  }

  clearData() {
    this.profileProvider.clearProfile().subscribe(() => {
      this.navCtrl.parent.parent.setRoot(LandingPage);
      this.platform.exitApp();
    });
  }

  ionViewWillEnter() {
    this.profile = this.profileProvider.getProfile() ? 
      this.profileProvider.getProfile() : this.profile;
    console.log(this.profile);
  }
}
