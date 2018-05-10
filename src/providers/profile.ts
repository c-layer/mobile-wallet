import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Profile } from '../model/profile';
import { Storage } from '@ionic/storage';
import { Account } from '../model/account';

@Injectable()
export class ProfileProvider {
    private static STORAGE_KEY = 'mtpelerin';
    private static MIN_VERSION = '0.1.12';
    private static CURRENT_VERSION = '0.1.15';
    private profile: Profile;

    constructor(private storage: Storage) { }

    public loadProfile(): Observable<Profile> {
        return Observable.fromPromise(
            this.storage.ready().then(() => this.storage.get(ProfileProvider.STORAGE_KEY))
                .then(profile => {
                    if (profile && this.getNumVersion(profile.version) < this.getNumVersion(ProfileProvider.MIN_VERSION)) {
                        this.clearProfile();
                        profile = null;
                    }

                    let tobeSaved = false;
                    if(profile && this.getNumVersion(profile.version) != this.getNumVersion(ProfileProvider.CURRENT_VERSION)) {
                        profile.networks = this.getDefaultNetworks();
                        profile.contracts = this.getDefaultContracts();
                        profile.version = ProfileProvider.CURRENT_VERSION;
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
            account.contracts = {};
        });

        return this.saveProfile();
    }

    public resetConfig(): Observable<Profile> {
        this.profile.contracts = this.getDefaultContracts();
        this.profile.networks = this.getDefaultNetworks();

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
        this.profile.version = ProfileProvider.CURRENT_VERSION;
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
            'mainnet': {},
            'testnet': {
                'ETH': [{
                    address: '0x2aa1748af2c3b927670a1548e660afeadc316f71' ,
                    name: 'Mt Pelerin',
                    types: [2, 1, 0, 0, 0, 0]
                },{
                    address: '0x7118b1087643df9978dbb385d9321b210ef838fb',
                    name: 'Mt Pelerin\'s Share',
                    types: [1, 1, 1, 2, 2, 2]
                }],
            },
            'mtpelerin': {}
        };
    }

    public getDefaultNetworks() {
        return [
            {
                'name': 'Mainnet',
                'code': 'mainnet',
                'active': false,
                'ETH': {
                    'name': 'Eth - Mt Pelerin',
                    'url': 'ws://mainnet-eth.mtpelerin.com:8546'
                },
                'RSK': {
                    'name': 'Rsk - Mt Pelerin',
                    'url': 'http://mainnet-rsk.mtpelerin.com:4444'
                }
            },
            {
                'name': 'Testnet',
                'code': 'testnet',
                'active': true,
                'ETH': {
                    'name': 'Eth MtPelerin',
                    'url': 'ws://testnet-eth.mtpelerin.com:8544'
                },
                'RSK': {
                    'name': 'Rsk MtPelerin',
                    'url': 'http://testnet-rsk.mtpelerin.com:4443'
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

    public getNumVersion(version: string): number {
        if (version == undefined || version.indexOf('.') == -1) {
            return 0;
        }
        const versions = version.split('.');
        let result = 0;
        for (var i = 0; i < versions.length; i++) {
            result = result + 10 ** (2 * i) * Number(versions[i]);
        }

        return result;
    }
}
