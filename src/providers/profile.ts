import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Profile } from '../model/profile';
import { Storage } from '@ionic/storage';
import { Account } from '../model/account';

@Injectable()
export class ProfileProvider {
    private static STORAGE_KEY = 'mtpelerin';
    private profile: Profile;

    constructor(private storage: Storage) { }

    public loadProfile(): Observable<Profile> {
        return Observable.fromPromise(
            this.storage.ready().then(() => this.storage.get(ProfileProvider.STORAGE_KEY))
                .then(profile => {
                    if(!profile) {
                        profile = this.newProfile({});
                    }

                    // FIX 0.1.7
                    let tobeSaved = false;
                    if (typeof (profile.mnemonicIsBackup) != "boolean") {
                        profile.mnemonicIsBackup = false;
                        tobeSaved = true;
                    }

                    if (!profile.contracts) {
                        profile.contracts = this.getDefaultContracts();
                        tobeSaved = true;
                    }

                    if (!profile.networks) {
                        profile.networks = this.getDefaultNetworks();
                        tobeSaved = true;
                    }

                    this.profile = profile;
                    if (tobeSaved) {
                        return this.saveProfile();
                    } else {
                        return profile;
                    }
                }));
    }

    public isProfileConsistent(): boolean {
        return this.profile.name
            && this.profile.accounts
            && this.profile.encryptedMnemonic
            && this.profile.derivationUsed
            && this.profile.encryptedWallet;
    }

    public getProfile(): Profile {
        return this.profile;
    }

    public saveProfile(): Observable<Profile> {
        return Observable.fromPromise(this.storage.set(ProfileProvider.STORAGE_KEY, this.profile)
            .then(() => {
                console.log('profile saved !');
                return this.profile;
            }));
    }

    public clearCache(): Observable<Profile> {
        this.profile.accounts.forEach(account => {
            account.portfolio = {};
        });

        return this.saveProfile();
    }

    public clearProfile(): Observable<void> {
        return Observable.fromPromise(this.storage.remove(ProfileProvider.STORAGE_KEY).then(profile => {
            this.profile = null;
            console.warn('wallet cleared !');
        }).catch(error => {
            console.error(error);
            this.profile = null;
        }));
    }

    public newProfile(params: any): Observable<Profile> {
        this.profile = new Profile();
        this.profile.name = 'default';
        this.profile.accounts = (params.accounts) ? params.accounts : [];
        this.profile.encryptedWallet = (params.encryptedWallet) ? params.encryptedWallet : [];
        this.profile.mnemonicIsBackup = (params.mnemonicIsBackup) ? params.mnemonicIsBackup : false;
        this.profile.contracts = this.getDefaultContracts();
        this.profile.networks = this.getDefaultNetworks();
        return this.saveProfile();
    }

    public setTokenDirectories(tokenDirectories: Array<string>) {
        return this.saveProfile();
    }

    public setAccounts(accounts: Array<Account>,
        encryptedWallet?: any,
        derivationUsed?: number,
        encryptedMnemonic?: any) {
        this.profile.accounts = accounts;
        if (encryptedWallet) {
            this.profile.encryptedWallet = encryptedWallet;
        }
        if (derivationUsed) {
            this.profile.derivationUsed = derivationUsed;
        }
        if (encryptedMnemonic) {
            this.profile.encryptedMnemonic = encryptedMnemonic;
        }
        return this.saveProfile();
    }

    public setMnemonicIsBackUp() {
        this.profile.mnemonicIsBackup = true;
        return this.saveProfile();
    }

    public setSettings(settings: any) {
        this.profile.settings = settings;
        return this.saveProfile();
    }

    public setNetworks(networks: any) {
        this.profile.networks = networks;
        return this.saveProfile();
    }

    public getDefaultContracts() {
        return {
            'mainnet': { },
            'testnet': {
                'RSK': [{
                    address: '0x347e70673323bbde4772af6fbbecf7caef084205',
                    directory: true
                }]
            },
            'mtpelerin': {
                'ETH': [{
                    address: '0x73b10223b2318cfb775fbe7bc5781a04c2a0a3cd',
                    directory: true
                }]
            }
        };
    }

    public getDefaultNetworks() {
        return [
          {
              'name': 'Mainnet',
              'code': 'mainnet',
              'active': true,
              'ETH': {
                  'name': 'Eth MtPelerin',
                  'url': 'ws://163.172.104.223:1014'
              },
              'RSK': {
                  'name': 'Rsk MtPelerin',
                  'url': 'http://163.172.104.223:4443'
              }
          },
          {
              'name': 'Testnet',
              'code': 'testnet',
              'active': false,
              'ETH': {
                  'name': 'Eth MtPelerin',
                  'url': 'ws://163.172.104.223:1024'
              },
              'RSK': {
                  'name': 'Rsk MtPelerin',
                  'url': 'http://163.172.104.223:4444'
              }
          },
          {
              'name': 'MtPelerin',
              'code': 'mtpelerin',
              'active': false,
              'ETH': {
                  'name': 'Eth MtPelerin',
                  'url': 'ws://163.172.104.223:1004'
              }
          }];
      }    
}
