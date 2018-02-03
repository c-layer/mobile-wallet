import { Component } from '@angular/core';
import { NavController } from 'ionic-angular/navigation/nav-controller';
import { AccountProvider } from '../../providers/account';
import { BarcodeScanner, BarcodeScanResult } from '@ionic-native/barcode-scanner';
import { Account } from '../../model/account';
import { Observable } from 'rxjs/Observable';
import { WalletSecurePage, WalletSecureMode } from '../wallet/wallet-secure/wallet-secure';

@Component({
  selector: 'page-scan',
  templateUrl: 'scan.html'
})
export class ScanPage {
  typeFound: string = '';

  constructor(private accountProvider: AccountProvider,
    private barcodeScanner: BarcodeScanner,
    private navCtrl: NavController
  ){}

  /**
   * 
   * Detect address type with the following:
   * - Public Address account
   * - Private Address account
   * - Token Directory Smart Contract
   * - Token Smart Contract
   * - Multisig Smart Contract
   * 
   * @param address 
   */
  detectAddressType(address: string) {
    if(address.length == Account.PRIVATE_KEY_LENGTH) {
      this.typeFound = 'Private Key';
      this.navCtrl.push(WalletSecurePage, { 
        mode: WalletSecureMode.ELEVATE_PRIVS,
        callback: (password) => {
          return this.accountProvider.addAccount(address, password).map((data) => {
            this.navCtrl.parent.select(0);
            this.navCtrl.popAll();
            return data;
          });
      }})
    }

    if(address.length == Account.PUBLIC_KEY_LENGTH) {
      this.typeFound = 'Public Key';
      return this.accountProvider.addAccount(address, undefined, 'Public Key').map((data) => {
        this.navCtrl.parent.select(0);
        this.navCtrl.popAll();
        return data;
      });
    }
  }

  scan() {
   Observable.fromPromise(this.barcodeScanner.scan()).first().subscribe(
      (barcodeData: BarcodeScanResult)  => {
        this.detectAddressType(barcodeData.text);
      },
      error => {
        console.error(error);
      });
  }

    
  ionViewWillEnter() {
    this.scan();
  }
}
