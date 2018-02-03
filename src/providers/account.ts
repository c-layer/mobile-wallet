/* Account.hotAccount('Wallet Static with Pkey',
   '0xf5515abe3dE30b9A9b8359e22Ba451B32AB3C40F',
   '0x2b509a3f22fcf5890ce908d49ba20520c9cedc458180148b8fd5970606646513'),
 Account.publicAccount('MtPelerin Public Miner', '0xfd7365ea32a3bb4858e1563e18d78bc09bb81df5'),
 Account.publicAccount('MtPelerin BankProject Cold/Miner', '0x459040565c09E9e851F52DBF6DD8689111093211'),
 Account.publicAccount('MtPelerin BankProject Hot', '0x9DCC65CfC9F1379c6073e8a778B177fE78291C2a'),
 Account.publicAccount('Enrique', '0xf40d14d0B1E06833826f6c3cE27F5CE9b27d4DB5')*/
 declare function require(moduleName: string): any;
 const Bip39 = require("bip39");
 const bitcoinjs = require('bitcoinjs-lib');
 
 import { Injectable } from '@angular/core';
 import { Account, AccountType } from '../model/account';
 import { Web3Provider } from './web3';
 import { Observable } from 'rxjs/Observable';
 import { ProfileProvider } from './profile';
 import { Profile } from '../model/profile';
 
 @Injectable()
 export class AccountProvider {
     private activeAccount: Account = null;
     private accounts: Account[] = [];
     private encryptedMnemonic: any;
     private derivationUsed: number;
     private encryptedWallet: any;
 
     constructor(private web3Provider: Web3Provider,
         private profileProvider: ProfileProvider) {
     }
 
     public loadAccounts() {
         let profile = this.profileProvider.getProfile();
         this.accounts = profile.accounts;
         this.accounts.forEach((account: Account) => {
             if (account.active) {
                 this.activeAccount = account;
             }
         });
         this.encryptedMnemonic = profile.encryptedMnemonic;
         this.derivationUsed = profile.derivationUsed;
         this.encryptedWallet = profile.encryptedWallet;
     }
 
     public unlock(password: string): Observable<boolean> {
         return Observable.fromPromise(new Promise((resolve, reject) => {
             setTimeout(() => {
                 let resolution: boolean = false;
                 let profile = this.profileProvider.getProfile();
                 if (profile) {
                     try {
                         this.web3Provider.getAccounts().wallet.decrypt(profile.encryptedWallet, password);
                         resolution = true;
                     } catch (e) {
                         console.error(e);
                     }
                 }
                 return resolve(resolution);
             }, 100);
         }));
     }
 
     public getActiveAccount(): Account {
         return this.activeAccount;
     }
 
     public getAccounts(): Account[] {
         return this.accounts;
     }
 
     private generateName(): string {
         let name = 'Account ';
         let similarAccountNames =
             this.accounts
                 .filter(account => account.name.startsWith(name));
         let id = similarAccountNames.length + 1;
         return name + id;
     }
 
     addAccount(key?: string, password?: string, name?: string): Observable<Account> {
         if (!name) {
             name = this.generateName();
         }

         let accountObs;
         if (!(key) || key.length == Account.PRIVATE_KEY_LENGTH) {
             accountObs = this.addPrivateAccount(password, key, name);
         } else if (key.length == Account.PUBLIC_KEY_LENGTH) {
             accountObs = this.addPublicAccount(key, name);
         } else {
            console.error('Invalid Key !');
            accountObs = Observable.throw('Invalid key !')
         }

         return accountObs;
     }
 
     private addPublicAccount(publicKey: string, name?: string): Observable<Account> {
         let account = Account.publicAccount(name, publicKey);
         this.accounts.push(account);
         return this.setActive(account).map(() => account);
     }
 
     private addPrivateAccount(password: string, privateKey?: string, name?: string): Observable<Account> {
         let internal = null;
         let wallet = this.web3Provider.getAccounts().wallet.decrypt(this.encryptedWallet, password);
         console.log('wallet decrypted');
         let derivationId = null;
 
         if (privateKey) {
             console.log('Importing external key');
             internal = this.web3Provider.getAccounts().privateKeyToAccount(privateKey);
         } else {
             console.log('Generate privateKey from deterministic wallet');
             const privateKey = this.generatePrivateKeyFromMenomnic(null, password, this.derivationUsed);
             derivationId = this.derivationUsed;
             this.derivationUsed++;
             internal = this.web3Provider.getAccounts().privateKeyToAccount(privateKey);
         }
         console.log(internal);
         wallet.add(internal);
         console.log(wallet.length);
         this.encryptedWallet = wallet.encrypt(password);
         console.log('wallet reencrypted');
 
         let account = Account.hotAccount(name, internal.address);
         account.derivationId = derivationId;

         this.accounts.forEach(account => account.active=false);
         this.accounts.push(account);
         account.active = true;

         return this.profileProvider.setAccounts(
             this.accounts, this.encryptedWallet, this.derivationUsed).map(() => account);
     }
 
     public getPrivateKey(account: Account, password: string): Observable<string> {
         if (account && account.address &&
             account.type == AccountType.HOT) {
             try {
                 let privateKey = null;
                 let wallet = this.web3Provider.getAccounts().wallet.decrypt(this.encryptedWallet, password);
                 for (var i = 0; i < wallet.length; i++) {
                     if (wallet[i].address == account.address) {
                         privateKey = wallet[i].privateKey;
                         break;
                     }
                 }
                 return Observable.of(privateKey);
             } catch (e) {
                 console.error('Unable to read the privateKey !');
                 return Observable.throw(e);
             }
         }
         return Observable.empty();
     }
 
     public removeAccount(account: Account, password: string): Observable<Profile> {
         let wallet = this.web3Provider.getAccounts().wallet.decrypt(this.encryptedWallet, password);
         wallet.remove(account.address);
         this.encryptedWallet = wallet.encrypt(password);
         this.accounts = this.otherAccounts(account);
         if (account == this.activeAccount) {
             this.setActive(this.accounts[0]);
         }
         return this.profileProvider.setAccounts(this.accounts, this.encryptedWallet);
     }
 
     public otherAccounts(account: Account): Account[] {
         if (!this.accounts || this.accounts.length == 0) {
             return [];
         }
         return this.accounts.filter(item => item != account);
     }
 
     public getAccount(address: string): Account {
         let result: Account = null;
         this.accounts.forEach(account => {
             if (account.address == address) { result = account; }
         });
         return result;
     }
 
     public getAccountName(address: string): string {
         let account = this.getAccount(address);
         return (account) ? account.name : address;
     }
 
     public setAccountName(account: Account, name: string) {
         let accountItem = this.getAccount(account.address);   
         accountItem.name = name;
         return this.profileProvider.setAccounts(this.accounts);
     }
 
     public setActive(account: Account): Observable<Profile> {
         if (account == this.activeAccount) return;
         if (this.activeAccount) {
             this.activeAccount.active = false;
         }
 
         account.active = true;
         this.activeAccount = account;
         return this.profileProvider.setAccounts(this.accounts);
     }
 
     public accountCanSend(account: Account, symbol: string): boolean {
         return account.type == AccountType.HOT
             && account.portfolio.filter(item => {
                 return item.currency == symbol && item.balance > 0;
             }).length > 0;
     };
 
     public createWallet(mnemonic: string, passphrase: string, password: string): Observable<Profile> {
         if (this.profileProvider.getProfile().encryptedWallet.length > 0) {
             console.log(this.profileProvider.getProfile());
             throw 'An encrypted wallet already exists !';
         }
 
         let wallet = this.web3Provider.getAccounts().wallet.create();
         this.accounts = [];
         this.encryptedWallet = wallet.encrypt(password);
         this.derivationUsed = 0;
         this.storeMnemonic(mnemonic, password);
 
         return this.profileProvider.setAccounts(
             this.accounts,
             this.encryptedWallet, this.derivationUsed, this.encryptedMnemonic);
     }
 
     private generatePrivateKeyFromMenomnic(passphrase, password, derivationUsed): string {
         console.log('Generating a private key...');
         let mnemonic = this.readMnemonic(password);
         const seed = Bip39.mnemonicToSeed(mnemonic, passphrase);
         let bip32RootKey = bitcoinjs.HDNode.fromSeedHex(seed, bitcoinjs.networks.bitcoin);
         const derived = bip32RootKey.derivePath("m/44'/60'/0'/0/" + derivationUsed);
         return '0x' + derived.keyPair.d.toBuffer(32).toString('hex');
     }
 
     private storeMnemonic(mnemonic: string, password: string) {
         let mnemonicHex = '';
         mnemonic.split(' ').forEach(word => {
             let i = Bip39.wordlists.EN.indexOf(word);
             mnemonicHex += (i + 0x1000).toString(16).substr(-3).toUpperCase();
         });
         let address = '0x' + ((new Array(64 + 1)).join('0') + mnemonicHex).substr(-64);
         this.encryptedMnemonic = this.web3Provider.getAccounts()
             .privateKeyToAccount(address).encrypt(password);
     }
 
     public readMnemonic(password: string): string {
         let mnemonicAddress = this.web3Provider.getAccounts().decrypt(this.encryptedMnemonic, password);
         console.log(mnemonicAddress);
         let ids = mnemonicAddress.privateKey.match(/.{1,3}/g);
         let words = [];
         ids.reverse().forEach(id => {
             if (words.length < 12) {
                 let i = parseInt(id, 16);
                 words.push(Bip39.wordlists.EN[i]);
             }
         });
         let mnemonic = words.reverse().join(' ');
         return mnemonic;
     }
 }