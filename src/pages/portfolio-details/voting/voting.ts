import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AccountProvider } from '../../../providers/account';
import { Account } from '../../../model/account';
import { Contract } from '../../../model/contract';
import { FormatProvider } from '../../../providers/format';
import { WalletSecurePage, WalletSecureMode } from '../../wallet/wallet-secure/wallet-secure';
import { ContractProvider } from '../../../providers/contract';

@Component({
  selector: 'page-voting',
  templateUrl: 'voting.html',
})
export class VotingPage {
  activeAccount: Account = null;
  supply: number = null;

  contract: Contract;

  constructor(public navCtrl: NavController, public navParams: NavParams,
    public formatProvider: FormatProvider,
    private contractProvider: ContractProvider,
    private accountProvider: AccountProvider) {
  }

  isClosedAtDefined() {
    return (this.contract.vote.closedAt < Number.MAX_SAFE_INTEGER);
  }

  isClosed() {
    return this.contract.vote.closedAt < (new Date().getTime() / 1000);
  }

  getContractName() {
    return (this.contract) ? this.contract.name : undefined; 
  }

  getVoteResult(value) {
    return Math.round(value / this.contract.vote.voteTokenTotalSupply * 1000) / 10 + '%';
  }

  vote(approve: true) {
    this.navCtrl.parent.parent.push(WalletSecurePage, {
      mode: WalletSecureMode.ELEVATE_PRIVS,
      callback: (password) => {
        this.navCtrl.pop();
        return this.contractProvider.vote(this.contract, approve, password);
      }
    });
  }

  ionViewWillEnter() {
    this.activeAccount = this.accountProvider.getActiveAccount();

    this.contract = this.navParams.get('contract');
    console.log(this.contract);
  }

  ionViewDidLeave() {
    this.navCtrl.popToRoot();
  }
}
