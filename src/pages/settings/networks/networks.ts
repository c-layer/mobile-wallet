import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ProfileProvider } from '../../../providers/profile';
import { NetworkProvider } from '../../../providers/network';
import { LoaderProvider } from '../../../providers/loader';

@Component({
  selector: 'page-networks',
  templateUrl: 'networks.html',
})
export class NetworksPage {
  public profile;
  public activeNetworkName = null;

  constructor(
    private networkProvider: NetworkProvider,
    private navCtrl: NavController,
    private loaderProvider: LoaderProvider,
    private profileProvider: ProfileProvider) {
  }

  updateNetworks() {
    this.networkProvider.updateNetworks(this.activeNetworkName);
    this.loaderProvider.startWeb3().catch(error => console.log);
  }

  public getNetworks() {
    if (!this.profile) {
      return [];
    }
    return this.profile.networks;
  }

  getActiveNetwork() {
    return this.networkProvider.getActiveNetworks();
  }

  ionViewWillEnter() {
    this.profile = this.profileProvider.getProfile() ?
      this.profileProvider.getProfile() : this.profile;

    this.activeNetworkName = this.networkProvider.getActiveNetworks().name;
  }

  ionViewDidLeave() {
    this.navCtrl.popToRoot();
  }
}
