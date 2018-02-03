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

                    // FIX 0.1.7
                    if(typeof(profile.mnemonicIsBackup) != "boolean") {
                        profile.mnemonicIsBackup = false;
                    }

                    this.profile = profile;
                    return profile;
                }));
    }

    public isProfileConsistent(): boolean {
        return this.profile.name
            && this.profile.tokenDirectories
            && this.profile.accounts
            && this.profile.encryptedMnemonic
            && this.profile.derivationUsed
            && this.profile.encryptedWallet;
    }

    public getProfile(): Profile {
        return this.profile;
    }

    private saveProfile(): Observable<Profile> {
        return Observable.fromPromise(this.storage.set(ProfileProvider.STORAGE_KEY, this.profile)
            .then(() => {
                console.log('profile saved !');
            return this.profile;
        }));
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
        this.profile.tokenDirectories = (params.tokenDirectories) ? params.tokenDirectories : [];
        this.profile.mnemonicIsBackup = (params.mnemonicIsBackup) ? params.mnemonicIsBackup : false;
        return this.saveProfile();
    }

    public setTokenDirectories(tokenDirectories: Array<string>) {
        this.profile.tokenDirectories = tokenDirectories;
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
}
