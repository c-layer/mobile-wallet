import { Component } from '@angular/core';
import { NavController } from 'ionic-angular/navigation/nav-controller';
import { AccountProvider } from '../../../providers/account';
import { NavParams } from 'ionic-angular/navigation/nav-params';
import { TabsPage } from '../../tabs/tabs';
import { SuccessPage } from '../../success/success';
import { ProfileProvider } from '../../../providers/profile';
import { Scheduler } from 'rxjs';
import { Observable } from 'rxjs/Observable';

export enum WalletCreationMode {
  GENERATE, RECOVER
}

@Component({
  selector: 'page-wallet-creation',
  templateUrl: 'wallet-creation.html'
})
export class WalletCreationPage {
  public mode: WalletCreationMode;
  public walletCreationMode = WalletCreationMode;
  public loadingMessage: string;
  public title: string;
  public error: string;

  private password: string;
  private mnemonic: string;
  private passphrase: string;
  private mnemonicIsBackup: string;

  private tokenDirectories: Array<string> = ['0x73b10223b2318cfb775fbe7bc5781a04c2a0a3cd'];

  constructor(private profileProvider: ProfileProvider,
    private accountProvider: AccountProvider,
    private navCtrl: NavController, private navParams: NavParams) { }

  createProfile() {
    this.loadingMessage = 'creating profile...';
    Scheduler.asap.schedule(() => {
      return this.profileProvider.newProfile({
        tokenDirectories: this.tokenDirectories,
        mnemonicIsBackup: this.mnemonicIsBackup,
      }).flatMap(profile => {
        console.log('Profile created !');
        this.loadingMessage = 'creating wallet...';
        return this.accountProvider.createWallet(this.mnemonic, this.passphrase, this.password);
      }).flatMap(profile => {
        console.log('Wallet created !');
        this.loadingMessage = 'adding first account...';
        return this.accountProvider.addAccount(null, this.password, 'Main Account');
      }).catch(error => {
        console.error('Error found : '+error);
        this.error = error;
        return Observable.of(null);
      }).first().subscribe(account => {
        if (account) {
          console.log('First Account created !');
          this.loadingMessage = 'finishing...';
          this.navCtrl.push(SuccessPage, {
            message: (this.mode == WalletCreationMode.RECOVER) ?
              'Your account was recovered successfully !' :
              'Your account was created successfully !',
            target: TabsPage
          });
        } else {
          this.profileProvider.clearProfile().first().subscribe();
        }
      });
    });
  }

  ionViewWillEnter() {
    this.mode = this.navParams.get('mode');
    this.password = this.navParams.get('password');
    this.mnemonic = this.navParams.get('mnemonic');
    this.mnemonicIsBackup = this.navParams.get('mnemonicIsBackup');
    this.passphrase = this.navParams.get('passphrase');

    this.title = (this.mode == WalletCreationMode.GENERATE) ?
      'Generation' : 'Recovery';

    this.createProfile();
  }
}
