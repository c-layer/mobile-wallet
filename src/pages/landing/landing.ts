import { Component } from '@angular/core';
import { NavController } from 'ionic-angular/navigation/nav-controller';
import { WalletMnemonicPage } from '../wallet/wallet-mnemonic/wallet-mnemonic';
import { WalletSecurePage, WalletSecureMode } from '../wallet/wallet-secure/wallet-secure';
import { LoaderProvider } from '../../providers/loader';

@Component({
  selector: 'page-landing',
  templateUrl: 'landing.html',
})
export class LandingPage {

  constructor(public navCtrl: NavController, public loaderProvider: LoaderProvider) { 
  }

  goToWalletSecure() {
    this.navCtrl.push(WalletSecurePage, { mode: WalletSecureMode.CREATE });
  }

  goToWalletRecovery() {
    this.navCtrl.push(WalletMnemonicPage, { mode: 'recover' });
  }

  ionViewDidEnter() {
    this.loaderProvider.setStatus('landingDisplayed');
    this.loaderProvider.startWeb3();
  }
}
