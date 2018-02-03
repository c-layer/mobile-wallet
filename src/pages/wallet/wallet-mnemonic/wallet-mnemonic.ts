declare function require(moduleName: string): any;
const Bip39 = require("bip39");

import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { NavController } from 'ionic-angular/navigation/nav-controller';
import { WalletSecurePage, WalletSecureMode } from '../wallet-secure/wallet-secure';
import { NavParams } from 'ionic-angular/navigation/nav-params';
import { WalletCreationPage, WalletCreationMode } from '../wallet-creation/wallet-creation';

export enum WalletMnemonicMode {
  GENERATE, RECOVER, BACKUP
}

@Component({
  selector: 'page-wallet-mnemonic',
  templateUrl: 'wallet-mnemonic.html'
})
export class WalletMnemonicPage {
  public mode: WalletMnemonicMode;
  public title: string;
  public walletMnemonicMode = WalletMnemonicMode;
  private password: string;
  public passphrase: string;
  public mnemonic: Array<string> = [];
  public hintWords: Array<string> = [];

  public memorizing: boolean= false;
  public backingUp: boolean=false;

  @Input() wordInput;

  constructor(private navCtrl: NavController,
    private navParams: NavParams,
    private changeDetectorRef: ChangeDetectorRef) {
  }

  generate() {
    this.mnemonic = Bip39.generateMnemonic().split(' ');
  }

  removeFromMnemonic(word: string) {
    this.mnemonic = this.mnemonic.filter(item =>
      word != item
    );
  }

  isValid(): boolean {
    return this.mnemonic.length == 12
      && Bip39.validateMnemonic(this.mnemonic.join(' '));
  }

  addToMnemonic(input: string) {
    let words = input.split(' ').filter(word => (word));
    this.mnemonic = this.mnemonic.concat(words).slice(0, 12);
    this.wordInput = null;
    this.hintWords = [];
    this.changeDetectorRef.detectChanges();
  }

  lowerInput() {
    if (this.wordInput) {
      this.wordInput = this.wordInput.toLowerCase();;
      this.changeDetectorRef.detectChanges();
    }
  }

  validateWord(event) {
    this.lowerInput();

    if (this.wordInput && this.wordInput.indexOf(' ') >= 0 && this.mnemonic.length < 12) {
      let length = this.wordInput.endsWith(' ') ?
        this.wordInput.length - 1 : this.wordInput.length;
      this.addToMnemonic(this.wordInput.substr(0, length));
    }

    if (this.wordInput && this.wordInput.length > 2) {
      this.hintWords = Bip39.wordlists.EN.filter(word =>
        word.substr(0, this.wordInput.length) == this.wordInput
      );
    } else {
      this.hintWords = [];
    }
  }

  backup() { 
    this.backingUp = true;
  }

  memorize() {
    this.memorizing = true;
  }

  wordInput1: string;
  wordInput2: string;
  wordInput3: string;
  wordInput4: string;
  wordInput5: string;
  wordInput6: string;
  wordInput7: string;
  wordInput8: string;
  wordInput9: string;
  wordInput10: string;
  wordInput11: string;
  wordInput12: string;
  isMemorized() {
    this.lowerInput();
    
    return this.mnemonic[0] == this.wordInput1
    && this.mnemonic[1] == this.wordInput2
    && this.mnemonic[2] == this.wordInput3
    && this.mnemonic[3] == this.wordInput4
    && this.mnemonic[4] == this.wordInput5
    && this.mnemonic[5] == this.wordInput6
    && this.mnemonic[6] == this.wordInput7
    && this.mnemonic[7] == this.wordInput8
    && this.mnemonic[8] == this.wordInput9
    && this.mnemonic[9] == this.wordInput10
    && this.mnemonic[10] == this.wordInput11
    && this.mnemonic[11] == this.wordInput12;
  }

  confirm() {
    if(this.mode == WalletMnemonicMode.BACKUP) {
      let update = this.navParams.get('update');
      update().subscribe(() => {
        this.navCtrl.popToRoot();
      });
    }

    if(this.mode == WalletMnemonicMode.GENERATE) {
      this.proceed();
    }
  }

  proceed() {
    if (this.mode == WalletMnemonicMode.RECOVER) {
      this.navCtrl.push(WalletSecurePage, {
        mode: WalletSecureMode.CREATE,
        mnemonic: this.mnemonic.join(' '),
        mnemonicIsBackup: true,
        passphrase: this.passphrase
      });
    }
    if (this.mode == WalletMnemonicMode.GENERATE) {
      this.navCtrl.setRoot(WalletCreationPage, {
        mode: WalletCreationMode.GENERATE,
        password: this.password,
        mnemonicIsBackup: this.isMemorized(),
        mnemonic: this.mnemonic.join(' '),
        passphrase: this.passphrase
      });
    }
  }

  ionViewWillEnter() {
    //let mnemonicString =  'blossom edit flavor there immune floor question street kiss expand planet trouble';
    this.password = this.navParams.get('password');
    let mnemonicString = this.navParams.get('mnemonic');
    if (!mnemonicString) {
      if (this.password) {
        this.mode = WalletMnemonicMode.GENERATE;
        this.title = 'Generate';
        this.generate();
      } else {
        this.mode = WalletMnemonicMode.RECOVER;
        this.title = 'Recovery';
      }
    } else {
      this.mode = WalletMnemonicMode.BACKUP;
      this.mnemonic = mnemonicString.split(' ');
      this.title = 'Backup';
    }
  }
}
