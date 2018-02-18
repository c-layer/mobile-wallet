import { Injectable } from '@angular/core';
import { ProfileProvider } from './profile';
import { AccountProvider } from './account';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { Web3Provider } from './web3';
import { NotificationsProvider } from './notifications';
import { Profile } from '../model/profile';

@Injectable()
export class LoaderProvider {
    private loadingSteps: any[] = [];
    private startTime: number = new Date().getTime();
    private endTime: number;

    private status: ReplaySubject<any> = new ReplaySubject<any>(1);

    constructor(private profileProvider: ProfileProvider,
        private accountProvider: AccountProvider,
        private web3Provider: Web3Provider,
        private notificationsProvider: NotificationsProvider) {
        this.setStatus('loaderBuilt');
    }

    public getLoadingSteps() {
        return this.loadingSteps;
    }

    public setStatus(name, active?, success?, message?) {
        if (!this.endTime) {
            let time = new Date().getTime() - this.startTime;
            this.loadingSteps.push({ time: time, name: name, success: success })
        }
        if (message) {
            this.status.next({ active: active, message: message, success: success });
        }
    }

    public getStatus(): Observable<any> {
        return this.status;
    }

    public endStart() {
        this.setStatus('Boot finished !')
        this.endTime = new Date().getTime();
    }

    public startWeb3() {
        this.notificationsProvider.start();
        this.web3Provider.start();
        this.setStatus('web3Loaded');

       // this.accountProvider.addAccount( 
       // '0x2b509a3f22fcf5890ce908d49ba20520c9cedc458180148b8fd5970606646513', 'token1234', 'External Account');
    }

    public start() {
        this.setStatus('appStarting');

        let profileLoadingObs = this.profileProvider.loadProfile().catch(error => {
            this.setStatus('profileError', false, false, error);
            return Observable.of(undefined);
        }).flatMap((profile: Profile) => {
            this.setStatus('profileLoaded');
            let result = Observable.of(null);
            if (profile && this.profileProvider.isProfileConsistent()) {
                this.accountProvider.loadAccounts();
                this.setStatus('appReady', false, true, 'application is ready !');
                result = Observable.of(profile);
            } else {
                this.setStatus('profileInConsistent', false, false, 'No profile found !');
            }
            return Observable.of(profile);
        });
        this.setStatus('appStarted', true, false, 'loading profile...');
        return profileLoadingObs;
    }
}